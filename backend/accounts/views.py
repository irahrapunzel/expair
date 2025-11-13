import json
import datetime
import os
from datetime import date, timezone
from urllib import request

import requests
import cloudinary
from rest_framework import status
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken, TokenError

from django.db import IntegrityError, transaction
from django.db.models import Q
from django.contrib.auth.hashers import check_password, make_password
from django.utils import timezone as django_timezone
from django.utils.timezone import localdate
from django.conf import settings
from django.template.loader import render_to_string
from django.core.mail import send_mail, EmailMultiAlternatives
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.contrib.auth import get_user_model

import logging
from ai.services.classifier import categorize_tradereq

CustomUser = get_user_model()

from .models import (
    Evaluation, GenSkill, ReputationSystem, TradeDetail, TradeHistory, UserInterest, User, VerificationStatus, UserCredential,
    SpecSkill, UserSkill, TradeRequest, TradeInterest, PasswordResetToken,
    Conversation, Message, DeletedConversation, Report, SupportTicket, UserVerification, Notification
)
from .serializers import (
    ProfileUpdateSerializer, UserCredentialSerializer,
    SpecSkillSerializer, UserSkillBulkSerializer,
    UserSerializer, GenSkillSerializer, UserInterestBulkSerializer, ReportSerializer, NotificationSerializer
)

from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from .emails import send_support_emails, generate_otp, send_otp_email

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_or_create_conversation(request, tradereq_id):
    try:
        trade = TradeRequest.objects.get(tradereq_id=tradereq_id)
    except TradeRequest.DoesNotExist:
        return Response({"error": "Trade not found"}, status=404)

    if request.user.id not in [trade.requester_id, trade.responder_id]:
        return Response({"error": "Not a participant in this trade"}, status=403)

    convo, _ = Conversation.objects.get_or_create(
        trade_request=trade,
        defaults={'requester': trade.requester, 'responder': trade.responder or request.user}
    )

    return Response({
        'conversation_id': convo.conversation_id,
        'trade_request_id': trade.tradereq_id,
        'requester_id': trade.requester_id,
        'responder_id': trade.responder_id,
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_conversations(request):
    try:
        # Get conversations where user is participant
        qs = Conversation.objects.filter(
            Q(requester=request.user) | Q(responder=request.user)
        ).order_by('-created_at')
        
        # ✅ EXCLUDE conversations that current user has deleted
        deleted_conversation_ids = DeletedConversation.objects.filter(
            user=request.user
        ).values_list('conversation_id', flat=True)
        
        if deleted_conversation_ids:
            qs = qs.exclude(conversation_id__in=deleted_conversation_ids)
        
        print(f"=== LIST CONVERSATIONS DEBUG ===")
        print(f"User: {request.user.id} ({request.user.username})")
        print(f"Found {qs.count()} conversations (after excluding deleted)")
        
        data = []
        for c in qs:
            # Handle orphaned data gracefully
            try:
                other_user = c.responder if c.requester_id == request.user.id else c.requester
                other_user_name = f"{other_user.first_name} {other_user.last_name}".strip() or other_user.username
                
                # Safely handle profile picture field
                try:
                    other_user_profilepic = other_user.profilePic
                    if not other_user_profilepic:
                        other_user_profilepic = None
                except Exception as pic_error:
                    print(f"Error handling profile picture for user {other_user.id}: {pic_error}")
                    other_user_profilepic = None
                    
                other_user_id = other_user.id
                other_user_username = other_user.username
            except (User.DoesNotExist, AttributeError):
                other_user_id = c.responder_id if c.requester_id == request.user.id else c.requester_id
                other_user_name = "UNKNOWN USER"
                other_user_profilepic = None
                other_user_username = f"deleted_user_{other_user_id}"
                print(f"WARNING: Conversation {c.conversation_id} references non-existent user ID {other_user_id}")
            
            # Get last message safely with encoding handling
            last_msg = Message.objects.filter(conversation=c).order_by('-created_at').first()
            last_message_content = None
            if last_msg and last_msg.content:
                try:
                    if isinstance(last_msg.content, bytes):
                        last_message_content = last_msg.content.decode('utf-8', errors='replace')
                    else:
                        last_message_content = str(last_msg.content)
                except (UnicodeDecodeError, UnicodeEncodeError):
                    last_message_content = "Message contains invalid characters"
            
            data.append({
                'conversation_id': c.conversation_id,
                'trade_request_id': c.trade_request_id,
                'reqname': getattr(c.trade_request, 'reqname', None),
                'exchange': getattr(c.trade_request, 'exchange', None),
                # ✅ ADD requester_id and responder_id for frontend perspective logic
                'requester_id': getattr(c.trade_request, 'requester_id', None),
                'responder_id': getattr(c.trade_request, 'responder_id', None),
                'other_user_id': other_user_id,
                'other_user_username': other_user_username,
                'other_user_name': other_user_name,
                'other_user_profilepic': other_user_profilepic,
                'created_at': c.created_at,
                'last_message': last_message_content,
                'last_sender_id': last_msg.sender_id if last_msg else None,
                'last_timestamp': last_msg.created_at.isoformat() if last_msg else None,
            })
        return Response({'conversations': data})
    except Exception as e:
        print(f"Error in list_conversations: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            'error': 'Failed to load conversations',
            'conversations': []
        }, status=500)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def messages_handler(request, conversation_id):
    try:
        convo = Conversation.objects.get(conversation_id=conversation_id)
    except Conversation.DoesNotExist:
        return Response({"error": "Conversation not found"}, status=404)

    if request.user.id not in [convo.requester_id, convo.responder_id]:
        return Response({"error": "Forbidden"}, status=403)

    if request.method == 'GET':
        msgs = Message.objects.filter(conversation=convo).order_by('created_at')
        messages_data = []
        for m in msgs:
            # Safely handle message content encoding
            content = m.content
            if content:
                try:
                    if isinstance(content, bytes):
                        content = content.decode('utf-8', errors='replace')
                    else:
                        content = str(content)
                except (UnicodeDecodeError, UnicodeEncodeError):
                    content = "Message contains invalid characters"
            
            messages_data.append({
                'message_id': m.message_id,
                'sender_id': m.sender_id,
                'content': content,
                'created_at': m.created_at,
            })
        return Response({'messages': messages_data})

    content = (request.data.get('content') or '').strip()
    if not content:
        return Response({"error": "content is required"}, status=400)
    msg = Message.objects.create(conversation=convo, sender=request.user, content=content)
    return Response({
        'message_id': msg.message_id,
        'sender_id': msg.sender_id,
        'content': msg.content,
        'created_at': msg.created_at,
    }, status=201)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_conversation(request, conversation_id):
    """
    Soft delete - hide conversation from current user's list only.
    Other user can still see it. Conversation and messages remain in database.
    
    Rules:
    - ❌ Cannot delete conversations with PENDING or ACTIVE trades
    - ✅ Can delete conversations with COMPLETED or CANCELLED trades
    - ✅ Can delete conversations with no trade (NULL status)
    """
    try:
        from .models import DeletedConversation
        
        conversation = Conversation.objects.select_related(
            'requester', 
            'responder',
            'trade_request'
        ).get(conversation_id=conversation_id)
        
        # Verify user is part of this conversation
        if request.user.id not in [conversation.requester_id, conversation.responder_id]:
            return Response({
                "error": "You are not authorized to delete this conversation"
            }, status=403)
        
        # ✅ CHECK TRADE STATUS - Prevent deletion if trade is active
        trade_request = conversation.trade_request
        if trade_request:
            if trade_request.status in [TradeRequest.Status.PENDING, TradeRequest.Status.ACTIVE]:
                return Response({
                    "error": "Cannot delete conversations with pending or active trades. Complete or cancel the trade first.",
                    "trade_status": trade_request.status
                }, status=400)
        
        # Create deleted conversation record for this user (soft delete)
        deleted_conv, created = DeletedConversation.objects.get_or_create(
            conversation=conversation,
            user=request.user
        )
        
        if not created:
            return Response({
                "message": "Conversation already deleted",
                "conversation_id": conversation_id,
                "already_deleted": True
            }, status=200)
        
        print(f"Conversation {conversation_id} soft deleted for user {request.user.id}")
        print(f"Trade status: {trade_request.status if trade_request else 'No trade'}")
        
        return Response({
            "message": "Conversation deleted successfully",
            "conversation_id": conversation_id,
            "deleted_for_current_user_only": True,
            "other_user_can_still_see": True
        }, status=200)
        
    except Conversation.DoesNotExist:
        return Response({
            "error": "Conversation not found"
        }, status=404)
    except Exception as e:
        print(f"Delete conversation error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            "error": f"Failed to delete conversation: {str(e)}"
        }, status=500)

@csrf_exempt
@api_view(['POST', 'GET']) 
@permission_classes([AllowAny])
def validate_field(request):
    print(f"DEBUG: Method: {request.method}")
    print(f"DEBUG: Request body: {request.body}")
    print(f"DEBUG: Content-Type: {request.content_type}")
    
    if request.method == 'GET':
        return JsonResponse({'message': 'validate-field endpoint is working', 'method': 'GET'})
    
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            field_name = data.get('field')
            value = data.get('value')
            print(f"DEBUG: Field: {field_name}, Value: {value}")

            if not field_name or not value:
                print(f"DEBUG: Missing field or value - Field: {field_name}, Value: {value}")
                return JsonResponse({'error': 'Field and value are required.'}, status=400)

            if field_name == 'username':
                exists = User.objects.filter(username__iexact=value).exists()
            elif field_name == 'email':
                exists = User.objects.filter(email__iexact=value).exists()
            else:
                return JsonResponse({'error': 'Invalid field for validation.'}, status=400)

            return JsonResponse({'exists': exists})
        except json.JSONDecodeError as e:
            print(f"DEBUG: JSON decode error: {e}")
            return JsonResponse({'error': 'Invalid JSON.'}, status=400)

    return JsonResponse({'error': 'Only POST and GET methods are allowed.'}, status=405)

@api_view(["POST"])
@permission_classes([AllowAny])
def forgot_password(request):
    """
    Handles a forgot password request.
    Always returns a successful response to prevent user enumeration.
    """
    email = request.data.get('email')
    if not email:
        return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(email=email)

        # Invalidate old tokens and create a new one
        PasswordResetToken.objects.filter(user=user).delete()
        token = PasswordResetToken.objects.create(user=user)

        # Link to your frontend password reset page
        reset_link = f"http://localhost:3000/reset-password?token={token.token}"
        context = {'user': user, 'reset_link': reset_link}

        # Render email content
        html_message = render_to_string('emails/password_reset_email.html', context)
        plain_message = f"Hello {user.first_name},\n\nClick the following link to reset your password:\n{reset_link}"

        # Send the email
        send_mail(
            'Expair Password Reset Request',
            plain_message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
            html_message=html_message,
        )
    except User.DoesNotExist:
        # If the user does not exist, we do nothing.
        # This prevents revealing that the email is not in our system.
        pass
    except Exception as e:
        # It's good practice to log the actual error for debugging
        print(f"Error in forgot_password view: {e}")

    # ✅ Always return this generic success message
    return Response(
        {'message': 'If an account with that email exists, a password reset link has been sent.'},
        status=status.HTTP_200_OK
    )
        
@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    """
    Handles a password reset request by validating the token and updating the password.
    """
    try:
        token_value = request.data.get('token')
        new_password = request.data.get('password')
        
        if not token_value or not new_password:
            return Response({'error': 'Token and new password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Find the token and validate it
        token_obj = get_object_or_404(PasswordResetToken, token=token_value)
        if not token_obj.is_valid():
            return Response({'error': 'Invalid or expired token.'}, status=status.HTTP_400_BAD_REQUEST)

        user = token_obj.user
        
        # Update the user's password and delete the token
        user.set_password(new_password)
        user.save()
        token_obj.delete()

        return Response({'message': 'Password has been reset successfully.'}, status=status.HTTP_200_OK)

    except PasswordResetToken.DoesNotExist:
        return Response({'error': 'Invalid or expired token.'}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        print(f"Error in reset_password view: {e}")
        return Response({'error': 'An unexpected error occurred.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])  
def get_user_posted_trades(request, username):
    """
    Get all posted trades by the given username.
    Used for viewing another user's profile.
    """
    try:
        user = CustomUser.objects.get(username=username)
    except CustomUser.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    posted_trades = TradeRequest.objects.filter(
        requester=user
    ).exclude(
        status__in=[TradeRequest.Status.ACTIVE, TradeRequest.Status.COMPLETED]
    ).prefetch_related('interests__interested_user').order_by('-tradereq_id')

    # Build mapping of requester's skills grouped by gen category
    requester_skills = {}
    user_skills_qs = UserSkill.objects.filter(user=user).select_related('specSkills__genSkills_id')
    for us in user_skills_qs:
        gen = us.specSkills.genSkills_id
        gen_categ = gen.genCateg if gen else None
        spec_name = us.specSkills.specName if us.specSkills else None
        if gen_categ:
            requester_skills.setdefault(gen_categ, []).append(spec_name or gen_categ)

    # Fallback general category name if no skills exist
    fallback_skill = GenSkill.objects.first()
    fallback_skill_name = fallback_skill.genCateg if fallback_skill else ""

    trades_data = []
    for t in posted_trades:
        offer = ""
        try:
            first_us = UserSkill.objects.filter(user_id=user.id).select_related("specSkills__genSkills_id").first()
            if first_us and first_us.specSkills:
                spec_name = getattr(first_us.specSkills, "specName", None)
                if spec_name:
                    offer = spec_name
                else:
                    gen = getattr(first_us.specSkills, "genSkills_id", None)
                    if gen and getattr(gen, "genCateg", None):
                        offer = gen.genCateg
        except Exception:
            offer = ""

        # fallback: if still empty, use any gen category from requester_skills
        if not offer and requester_skills:
            first_cat, specs = next(iter(requester_skills.items()))
            offer = specs[0] if specs else first_cat

        # last resort: any specific skill in DB
        if not offer:
            any_spec = SpecSkill.objects.first()
            offer = any_spec.specName if any_spec else ""

        trades_data.append({
            "tradereq_id": t.tradereq_id,
            "reqname": t.reqname,
            "deadline": t.reqdeadline.isoformat() if t.reqdeadline else "",
            "status": t.status,
            "offer": offer,
            "requester_skills": requester_skills,
            "created_at": t.created_at,
            "offer": offer,
        })

    return Response({
        "posted_trades": trades_data,
        "count": len(trades_data)
    }, status=200)


@api_view(['GET'])
@permission_classes([AllowAny])
def explore_feed(request):
    """
    Explore feed: ensure 'offer' prefers a specific specName and include 'specName' in the response.
    """
    viewer = request.user if getattr(request.user, "id", None) else None

    qs = (TradeRequest.objects
          .select_related("requester")
          .filter(
              Q(status__isnull=True) | Q(status=TradeRequest.Status.CANCELLED)
          )
          .order_by("-tradereq_id"))[:50]

    # Preload viewer's interest genSkill ids
    viewer_gen_interests = []
    if viewer:
        viewer_gen_interests = list(
            UserInterest.objects.filter(user_id=viewer.id)
            .values_list("genSkills_id_id", flat=True)
        )

    items_with_matches = []
    items_without_matches = []

    # Global fallback to any specific skill name (never a generic "Skills & Services")
    any_spec = SpecSkill.objects.first()
    global_spec_fallback = getattr(any_spec, "specName", "") if any_spec else ""

    for tr in qs:
        requester = tr.requester
        
        # ✅ Build proper display name - prioritize first_name + last_name
        first_name = (requester.first_name or "").strip()
        last_name = (requester.last_name or "").strip()
        
        if first_name or last_name:
            display_name = f"{first_name} {last_name}".strip()
        else:
            display_name = requester.username
        
        needs = tr.reqname
        
        # ✅ Handle profile picture - ensure valid URL or None
        profile_pic_url = None
        if requester.profilePic:
            pic = str(requester.profilePic).strip()
            if pic and (pic.startswith('http://') or pic.startswith('https://')):
                profile_pic_url = pic

        # Load requester user skills (specific names + general id/category)
        req_user_skills = list(
            UserSkill.objects.filter(user_id=requester.id).select_related("specSkills__genSkills_id")
        )

        # collect specNames and mapping
        genid_to_specs = {}
        spec_names = []
        genid_to_gencat = {}
        for us in req_user_skills:
            spec = getattr(us, "specSkills", None)
            if not spec:
                continue
            spec_name = getattr(spec, "specName", None)
            gen = getattr(spec, "genSkills_id", None)
            gen_id = getattr(gen, "genSkills_id", None) if gen else None
            gen_cat = getattr(gen, "genCateg", None) if gen else None
            if gen_id:
                genid_to_specs.setdefault(gen_id, []).append(spec_name or gen_cat)
                genid_to_gencat[gen_id] = gen_cat
            if spec_name:
                spec_names.append(spec_name)

        can_offer = ""
        has_match = False

        # Priority 1: Find skills that the requester has AND the viewer is interested in
        if viewer and viewer_gen_interests and genid_to_specs:
            matching_skills = set(viewer_gen_interests) & set(genid_to_specs.keys())
            
            if matching_skills:
                matching_skill_id = list(matching_skills)[0]
                can_offer = genid_to_specs[matching_skill_id][0] if genid_to_specs[matching_skill_id] else genid_to_gencat.get(matching_skill_id, "")
                has_match = True
        
        # Priority 2: If no match, show any skill the requester has
        if not can_offer and genid_to_specs:
            first_category_skills = list(genid_to_specs.values())[0]
            can_offer = first_category_skills[0] if first_category_skills else ""
        
        # Priority 3: If requester has no skills, use fallback
        if not can_offer:
            any_spec = SpecSkill.objects.first()
            can_offer = any_spec.specName if any_spec else ""
        
        item_data = {
            "tradereq_id": tr.tradereq_id,
            "requester_id": requester.id,
            "name": display_name,  # ✅ Now properly shows first_name + last_name
            "rating": float(requester.avgStars or 0),
            "ratingCount": int(requester.ratingCount or 0),
            "level": int(requester.level or 0),
            "need": needs,
            "offer": can_offer,
            "deadline": tr.reqdeadline.isoformat() if tr.reqdeadline else "",
            "profilePicUrl": profile_pic_url,  # ✅ Now properly validated
            "userId": requester.id,
            "username": requester.username, 
        }

        if has_match:
            items_with_matches.append(item_data)
        else:
            items_without_matches.append(item_data)

    def unique_by_tradereq(items):
        seen = set()
        unique = []
        for item in items:
            if item["tradereq_id"] not in seen:
                seen.add(item["tradereq_id"])
                unique.append(item)
        return unique

    items = unique_by_tradereq(items_with_matches) + unique_by_tradereq(items_without_matches)
    return Response({"items": items}, status=200)
    
@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def me(request):
    print("=== DJANGO ME VIEW DEBUG ===")
    print(f"Request method: {request.method}")
    print(f"User authenticated: {request.user.is_authenticated}")
    
    if not request.user.is_authenticated:
        return Response({"detail": "Authentication credentials were not provided."}, status=401)
    
    target = request.user
    
    if request.method == "GET":
        return Response(_public_user_payload(target, request), status=200)

    # ---- PATCH logic starts here ----
    data = request.data.copy()

    # Ignore string fields unless they're actual files
    if "profilePic" in data and not request.FILES.get("profilePic"):
        data.pop("profilePic")

    # Handle id_document separately (goes to UserVerification)
    if "id_document" in data and not request.FILES.get("id_document"):
        data.pop("id_document")

    serializer = ProfileUpdateSerializer(instance=target, data=data, partial=True)
    serializer.is_valid(raise_exception=True)
    
    # Save - ProfileUpdateSerializer handles UserVerification updates
    updated = serializer.save()

    return Response(_public_user_payload(updated, request), status=200)

def _public_user_payload(user, request=None):
    """
    Helper function to build user payload - UPDATED for UserVerification
    """
    # profilePic is now a Cloudinary URL, use directly
    pic = user.profilePic if user.profilePic else None

    # Handle links field
    links_array = user.links or []

    # Get verification data from related UserVerification model
    try:
        verification = user.verification
        email_verified = verification.email_verified
        id_verification_status = verification.id_verification_status
        id_document_url = verification.id_document if verification.id_document else None
        is_fully_verified = verification.is_fully_verified
        verification_progress = verification.verification_progress
    except UserVerification.DoesNotExist:
        # Fallback if verification record doesn't exist
        email_verified = False
        id_verification_status = VerificationStatus.UNVERIFIED
        id_document_url = None
        is_fully_verified = False
        verification_progress = 0
    
    # Interests
    interests = []
    try:
        qs = UserInterest.objects.filter(user_id=user.id).select_related("genSkills_id")
        interests = [ui.genSkills_id.genCateg for ui in qs]
    except Exception as e:
        print(f"[DEBUG] could not fetch interests for user {user.id}: {e}")

    payload = {
        "user_id": user.id,
        "id": user.id,
        "username": user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email, 
        "bio": user.bio,
        "location": getattr(user, "location", ""),
        "links": links_array,
        "interests": interests,
        "avgStars": float(user.avgStars or 0),
        "ratingCount": int(user.ratingCount or 0),
        "rating": float(user.avgStars or 0),
        "reviews": int(user.ratingCount or 0),
        "profilePic": pic,
        "created_at": user.created_at,
        "level": int(user.level or 0),
        "tot_XpPts": int(user.tot_XpPts or 0),
        "tot_xppts": int(user.tot_XpPts or 0),
        "totalXp": int(user.tot_XpPts or 0),
        
        "email_verified": email_verified,
        "id_verification_status": id_verification_status,
        "is_fully_verified": is_fully_verified,
        "verification_progress": verification_progress,
        "id_document": id_document_url,
        "birthdate": user.birthdate,
        "nationality": user.nationality,
    }
    
    return payload

@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def user_detail(request, user_id: int):
    user = get_object_or_404(User, pk=user_id)

    if request.method == "GET":
        return Response(_public_user_payload(user, request), status=200)

    elif request.method == "PATCH":
        # Only allow self-edit
        if request.user.id != user.id:
            return Response({"detail": "You cannot edit another user's profile."}, status=403)

        data = request.data.copy()
        data.pop("user_id", None)

        # Ignore profilePic unless it's a real file
        if "profilePic" in data and not request.FILES.get("profilePic"):
            data.pop("profilePic")

        # Ignore id_document unless it's a real file
        if "id_document" in data and not request.FILES.get("id_document"):
            data.pop("id_document")

        # Handle password safely
        if "password" in data:
            user.set_password(data["password"])
            data.pop("password")

        # Handle links (store as JSON array)
        if "links" in data:
            try:
                if isinstance(data["links"], str):
                    data["links"] = json.loads(data["links"])
            except Exception:
                return Response({"error": "Invalid format for links"}, status=400)

        serializer = ProfileUpdateSerializer(instance=user, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated = serializer.save()

        return Response(_public_user_payload(updated, request), status=200)

@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def user_detail_by_username(request, username: str):
    # Use get_object_or_404 for cleaner lookup, matching user_detail
    user = get_object_or_404(User, username__iexact=username)

    if request.method == "GET":
        return Response(_public_user_payload(user, request), status=200)

    elif request.method == "PATCH":
        # Only allow self-edit
        if request.user.id != user.id:
            return Response({"detail": "You cannot edit another user's profile."}, status=403)

        data = request.data.copy()
        data.pop("user_id", None)

        # Ignore profilePic unless it's a real file
        if "profilePic" in data and not request.FILES.get("profilePic"):
            data.pop("profilePic")

        # CHANGED: Match user_detail by checking for "id_document"
        if "id_document" in data and not request.FILES.get("id_document"):
            data.pop("id_document")

        # Handle password safely
        if "password" in data:
            user.set_password(data["password"])
            data.pop("password")

        # Handle links (store as JSON array)
        if "links" in data:
            try:
                if isinstance(data["links"], str):
                    data["links"] = json.loads(data["links"])
            except Exception:
                return Response({"error": "Invalid format for links"}, status=400)

        serializer = ProfileUpdateSerializer(instance=user, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated = serializer.save()

        return Response(_public_user_payload(updated, request), status=200)

@api_view(['GET', 'POST', 'PUT', 'DELETE'])
@permission_classes([AllowAny])
def user_credentials(request, user_id: int):
    """
    GET -> return all user's credentials
    POST -> add new credential
    PUT -> update existing credential
    DELETE -> remove credential
    """
    if request.method == 'GET':
        credentials = UserCredential.objects.filter(user_id=user_id).select_related(
            'genskills_id', 'specskills_id'
        ).order_by('-created_at')
        
        serializer = UserCredentialSerializer(credentials, many=True)
        return Response({"credentials": serializer.data}, status=200)

    elif request.method == 'POST':
        # Add new credential
        data = request.data.copy()
        if 'user' not in data:
            data['user'] = user_id  # Ensure user ID is set
        
        serializer = UserCredentialSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user_id=user_id)
        
        return Response(serializer.data, status=201)

    elif request.method == 'PUT':
        # Update existing credential
        credential_id = request.data.get('usercred_id')
        if not credential_id:
            return Response({"error": "usercred_id is required for updates"}, status=400)
        
        try:
            credential = UserCredential.objects.get(
                usercred_id=credential_id, 
                user_id=user_id
            )
        except UserCredential.DoesNotExist:
            return Response({"error": "Credential not found"}, status=404)
        
        # Don't allow changing the user
        data = request.data.copy()
        data.pop('user', None)
        
        serializer = UserCredentialSerializer(credential, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response(serializer.data, status=200)

    elif request.method == 'DELETE':
        # Delete credential
        credential_id = request.data.get('usercred_id')
        if not credential_id:
            return Response({"error": "usercred_id is required"}, status=400)
        
        try:
            credential = UserCredential.objects.get(
                usercred_id=credential_id, 
                user_id=user_id
            )
            credential.delete()
            return Response({"message": "Credential deleted successfully"}, status=200)
        except UserCredential.DoesNotExist:
            return Response({"error": "Credential not found"}, status=404)


@api_view(['GET', 'POST', 'DELETE'])
@permission_classes([AllowAny])
def user_skills(request, user_id: int):
    """
    GET -> return all user's skills, grouped by categories
    POST -> add new skills
    DELETE -> remove skills from the user
    """
    if request.method == 'POST':
        serializer = UserSkillBulkSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_id = serializer.validated_data['user_id']
        items = serializer.validated_data['items']

        # Insert new skills in bulk
        for item in items:
            for skill_id in item.get('specskills_ids', []):
                UserSkill.objects.create(user_id=user_id, specSkills_id=skill_id)

        return Response({"message": "Skills added successfully."}, status=201)

    elif request.method == 'DELETE':
        # Delete selected skills
        skill_ids_to_delete = request.data.get('specskills_ids', [])
        UserSkill.objects.filter(user_id=user_id, specSkills_id__in=skill_ids_to_delete).delete()
        return Response({"message": "Skills removed successfully."}, status=200)

    else:
        # GET: Return grouped user skills
        skills = UserSkill.objects.filter(user_id=user_id).select_related("specSkills__genSkills_id")
        skill_groups = {}
        for skill in skills:
            category = skill.specSkills.genSkills_id.genCateg
            skill_name = skill.specSkills.specName
            if category not in skill_groups:
                skill_groups[category] = []
            skill_groups[category].append(skill_name)

        return Response({"skill_groups": skill_groups}, status=200)

@api_view(['POST'])
@permission_classes([AllowAny])
def google_login(request):
    print("=== DJANGO GOOGLE LOGIN DEBUG ===")
    print(f"Request data: {request.data}")
    
    email = request.data.get('email')
    name = request.data.get('name', '')
    image = request.data.get('image')

    if not email:
        return Response({"error": "Email is required"}, status=400)

    try:
        # Check if user exists
        user = User.objects.get(email=email)
        print(f"Existing user found: {user.username}")
        
        # EXISTING USER LOGIC - Generate JWT tokens like regular login
        try:
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)
            print("JWT tokens generated for existing Google user")
        except Exception as token_error:
            print(f"Token generation failed: {token_error}")
            return Response({
                "error": "Authentication system error. Please try again."
            }, status=500)
        
        # Get user payload (same as your regular login)
        user_payload = _public_user_payload(user, request)
        
        # Return same format as your regular login for existing users
        return Response({
            "is_new": False,
            "message": "Login successful",
            "user_id": user.id,
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "name": user.first_name,  # For compatibility
            "profilePic": user_payload.get("profilePic"),
            "image": user_payload.get("profilePic"),
            "access": access_token,  # JWT tokens for existing user
            "refresh": refresh_token,
        }, status=200)
        
    except User.DoesNotExist:
        print(f"New user with email: {email}")
        
        # NEW USER LOGIC - Parse name and return registration data
        full_name = name.strip()
        name_parts = full_name.split(" ") if full_name else []
        first_name = name_parts[0] if name_parts else ""
        last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else ""
        
        # Return data for new user registration flow (NO tokens)
        return Response({
            "is_new": True,
            "email": email,
            "name": name,
            "first_name": first_name,
            "last_name": last_name,
            "image": image,
            "message": "New user detected - please complete registration"
        }, status=200)
        
    except Exception as e:
        print(f"Error in google_login: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            "error": "Server error occurred"
        }, status=500)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    print("=== DJANGO LOGIN DEBUG ===")
    print(f"Request method: {request.method}")
    print(f"Request content type: {request.content_type}")
    print(f"Request data: {request.data}")
    
    # Extract credentials
    identifier = request.data.get('identifier', '').strip()
    password = request.data.get('password', '')
    
    print(f"Login attempt for identifier: '{identifier}'")
    print(f"Identifier length: {len(identifier)}")
    print(f"Identifier repr: {repr(identifier)}")

    if not identifier or not password:
        return Response({
            "error": "Username/email and password are required."
        }, status=400)

    try:
        # Find user by username or email (case-insensitive)
        user_query = Q(username__iexact=identifier) | Q(email__iexact=identifier)
        user = User.objects.filter(user_query).first()
        
        print(f"Query result: {user}")
        
        if not user:
            print("No user found with that identifier")
            # Debug: Show what users exist
            all_usernames = User.objects.values_list('username', 'email')
            print(f"Existing users: {list(all_usernames)}")
            return Response({
                "error": "Invalid username/email or password."
            }, status=401)
        
        print(f"User found: ID={user.id}, username='{user.username}'")
        
        # Check password
        if not check_password(password, user.password):
            print("Password check failed")
            return Response({
                "error": "Invalid username/email or password."
            }, status=401)

        print("Password check successful")

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)
        
        # Get user payload
        user_payload = _public_user_payload(user, request)
        
        response_data = {
            "message": "Login successful.",
            "user_id": user.id,
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "name": user.first_name,
            "profilePic": user_payload.get("profilePic"),
            "image": user_payload.get("profilePic"),
            "access": access_token,
            "refresh": refresh_token,
        }
        
        return Response(response_data, status=200)
        
    except Exception as e:
        print(f"Login error: {e}")
        import traceback
        traceback.print_exc()
        return Response({
            "error": "Login failed. Please try again."
        }, status=500)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_user(request):
    refresh = request.data.get("refresh")
    if not refresh:
        return Response({"error": "Missing refresh token"}, status=400)
    try:
        token = RefreshToken(refresh)
        token.blacklist()
    except TokenError:
        return Response({"error": "Invalid refresh token"}, status=400)
    return Response({"message": "Logged out"}, status=200)

@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser]) 
def register_user(request):
    print(request.FILES)
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        instance = serializer.save()
        return Response(
            {
                "message": "User registered successfully",
                "user_id": getattr(instance, "user_id", None),
            },
            status=201,
        )
    return Response(serializer.errors, status=400)

@api_view(['GET'])
@permission_classes([AllowAny]) 
def list_general_skills(request):
    """
    Return all general skills from genskills_tbl.
    """
    qs = GenSkill.objects.all().order_by('genCateg')
    data = GenSkillSerializer(qs, many=True).data
    return Response(data)

@api_view(['POST'])
def add_user_interests(request):
    """
    Body JSON: { "user_id": 123, "genSkills_ids": [1,3,5] }
    Inserts rows into userinterests_tbl (one per selected general category).
    """
    ser = UserInterestBulkSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    user_id = ser.validated_data['user_id']
    ids = ser.validated_data['genSkills_ids']

    created = 0
    for gid in ids:
        # Avoid duplicates: try to find first, create if none
        try:
            gen = GenSkill.objects.get(pk=gid)
            _, was_created = UserInterest.objects.get_or_create(
                user_id=user_id,
                genSkills_id_id=int(gid)
            )
            if was_created:
                created += 1
        except IntegrityError:
            # In case you later add a DB unique constraint, ignore duplicates gracefully
            pass

    return Response({"added_or_existing": created}, status=status.HTTP_201_CREATED)

@api_view(['GET', 'DELETE'])
@permission_classes([AllowAny])
def user_interests(request, user_id: int):
    """
    GET -> list user interests
    DELETE -> remove selected interests (bulk supported)
    """
    if request.method == 'GET':
        qs = UserInterest.objects.filter(user_id=user_id).select_related("genSkills_id")
        interests = [ui.genSkills_id.genCateg for ui in qs]
        return Response(interests, status=200)

    elif request.method == 'DELETE':
        # Expect: { "genSkills_ids": [1, 3, 5] }
        ids = request.data.get("genSkills_ids", [])
        if not isinstance(ids, list) or not ids:
            return Response({"error": "genSkills_ids must be a non-empty list"}, status=400)

        deleted, _ = UserInterest.objects.filter(
            user_id=user_id,
            genSkills_id_id__in=ids
        ).delete()

        return Response({"deleted_count": deleted}, status=200)

@api_view(['GET'])
@permission_classes([AllowAny]) 
def list_specific_skills(request):
    """
    GET /skills/specific/?genskills_id=2  -> list specs under a general category
    If no genskills_id, return all specs.
    """
    gid = request.query_params.get('genskills_id')
    qs = SpecSkill.objects.all()
    if gid:
        qs = qs.filter(genSkills_id_id=int(gid))
    qs = qs.order_by('specName')
    return Response(SpecSkillSerializer(qs, many=True).data)

@api_view(['POST'])
def add_user_skills(request):
    ser = UserSkillBulkSerializer(data=request.data)
    ser.is_valid(raise_exception=True)

    user_id = ser.validated_data['user_id']
    items = ser.validated_data['items']

    created = 0
    for it in items:
        gid = it['genskills_id']
        ids = list(it.get('specskills') or [])
        names = list(it.get('spec_names') or [])

        # If names were provided, resolve to ids (and validate they belong to the same gen)
        if names:
            qs = SpecSkill.objects.filter(genSkills_id_id=int(gid), specName__in=names)
            found_names = {s.specName for s in qs}
            missing = set(names) - found_names
            if missing:
                return Response(
                    {"detail": f"Unknown specializations for genskills_id={gid}: {sorted(missing)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            ids.extend(qs.values_list('specSkills_id', flat=True))

        # Deduplicate ids just in case
        ids = list(dict.fromkeys(ids))

        for sid in ids:
            # safety: ensure each spec really belongs to gid
            try:
                spec = SpecSkill.objects.get(pk=sid)
                if int(spec.genSkills_id_id) != int(gid):
                    return Response(
                        {"detail": f"specskills {sid} does not belong to genskills_id {gid}."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            except SpecSkill.DoesNotExist:
                return Response({"detail": f"specskills {sid} not found."}, status=404)

            try:
                _, was_created = UserSkill.objects.get_or_create(
                    user_id=user_id,
                    specSkills_id=sid
                )
                if was_created:
                    created += 1
            except IntegrityError:
                pass

    return Response({"inserted": created}, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
@permission_classes([AllowAny]) 
@transaction.atomic
def complete_registration(request):
    """
    Complete user registration with profile, interests, and skills.
    Supports file uploads to Cloudinary and full FormData payload.
    UPDATED: Now handles UserVerification model separately
    """
    import json

    print("=== COMPLETE REGISTRATION DEBUG ===")
    print("Request data keys:", list(request.data.keys()))
    print("Request files:", list(request.FILES.keys()))

    # Get and validate user fields
    first_name = request.data.get("first_name", "")
    last_name = request.data.get("last_name", "")
    username = request.data.get("username", "")
    email = request.data.get("email", "")
    password = request.data.get("password", "")
    bio = request.data.get("bio", "")
    location = request.data.get("location", "")
    birthdate = request.data.get("birthdate", None)
    nationality = request.data.get("nationality", "")
    
    # Handle links as JSON array
    links_raw = request.data.get("links", "[]")
    try:
        if isinstance(links_raw, str):
            links_array = json.loads(links_raw)
        elif isinstance(links_raw, list):
            links_array = links_raw
        else:
            links_array = []
    except json.JSONDecodeError:
        print(f"Failed to parse links: {links_raw}")
        links_array = []

    print(f"Links parsed: {links_array}")
    print(f"User data: {username}, {email}, {first_name}, {last_name}")

    # Validate required fields
    if not username or not email or not password:
        return Response({
            "error": "Username, email, and password are required"
        }, status=400)

    # Check if user already exists (from OTP flow)
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({
            "error": "Email not found in verification records. Please restart registration."
        }, status=400)

    # Verify email was verified
    if not user.verification.email_verified:
        return Response({"error": "Please verify your email first"}, status=400)

    # ✅ Update the existing verified user
    user.username = username
    user.first_name = first_name
    user.last_name = last_name
    user.bio = bio
    user.location = location
    user.links = links_array
    if birthdate:
        user.birthdate = birthdate
    if nationality:
        user.nationality = nationality
        
    if password:
        user.set_password(password)
    user.save()
    print(f"[INFO] Updated existing user from OTP flow: {user.id}")


    # Handling genSkills_ids (Array of IDs)
    genSkills_ids_raw = request.data.get("genSkills_ids", "[]")
    try:
        genSkills_ids = json.loads(genSkills_ids_raw) if isinstance(genSkills_ids_raw, str) else genSkills_ids_raw
    except json.JSONDecodeError:
        return Response({"error": "Invalid format for genSkills_ids"}, status=400)

    # Handling specSkills (Object with arrays)
    specSkills_raw = request.data.get("specSkills", "{}")
    try:
        specSkills = json.loads(specSkills_raw) if isinstance(specSkills_raw, str) else specSkills_raw
    except json.JSONDecodeError:
        return Response({"error": "Invalid format for specSkills"}, status=400)

    # Ensure genSkills_ids is a list of integers
    if isinstance(genSkills_ids, list):
        genSkills_ids = [int(id) for id in genSkills_ids if str(id).isdigit()]
    else:
        return Response({"error": "genSkills_ids should be an array"}, status=400)

    try:
        print(f"User created successfully with ID: {user.id}")
        
        # UserVerification is automatically created by the post_save signal

        # Handle profilePic upload to Cloudinary
        profilePic = request.FILES.get("profilePic")
        if profilePic:
            try:
                upload_result = cloudinary.uploader.upload(
                    profilePic,
                    folder="media/profile_pics",
                    public_id=f"user_{user.id}_profile",
                    resource_type="image",
                    overwrite=True,
                    invalidate=True
                )
                user.profilePic = upload_result['secure_url']
                print(f"[SUCCESS] Profile pic uploaded to Cloudinary: {upload_result['secure_url']}")
            except Exception as e:
                print(f"[ERROR] Cloudinary upload failed for profilePic: {e}")
                import traceback
                traceback.print_exc()
        else:
            # Check if this is a Google user with profile picture URL
            google_image_url = request.data.get("google_image_url")
            if google_image_url:
                try:
                    # Download the Google profile picture
                    response = requests.get(google_image_url, timeout=10)
                    response.raise_for_status()
                    
                    # Upload to Cloudinary
                    from io import BytesIO
                    upload_result = cloudinary.uploader.upload(
                        BytesIO(response.content),
                        folder="media/profile_pics",
                        public_id=f"user_{user.id}_google_profile",
                        resource_type="image",
                        overwrite=True
                    )
                    user.profilePic = upload_result['secure_url']
                    print(f"[SUCCESS] Google profile picture uploaded to Cloudinary: {upload_result['secure_url']}")
                except Exception as e:
                    print(f"[ERROR] Failed to download/upload Google profile picture: {e}")
            
        # Handle ID verification document upload to Cloudinary
        id_document_file = request.FILES.get("id_document")
        id_type = request.data.get("id_type", "Government ID")
        
        if id_document_file:
            try:
                # Determine resource type (image or raw for PDFs)
                resource_type = "image" if id_document_file.content_type.startswith("image/") else "raw"                
                upload_result = cloudinary.uploader.upload(
                    id_document_file,
                    folder="media/user_verifications",
                    public_id=f"user_{username}_verification",
                    resource_type=resource_type,
                    overwrite=True,
                    invalidate=True
                )
                
                # Get the UserVerification record (created by signal)
                verification = user.verification
                verification.id_document = upload_result['secure_url']
                verification.id_type = id_type
                verification.id_verification_status = VerificationStatus.PENDING
                verification.id_submitted_at = django_timezone.now()
                verification.save()
                
                print(f"[SUCCESS] Verification ID uploaded to Cloudinary: {upload_result['secure_url']}")
            except Exception as e:
                print(f"[ERROR] Cloudinary upload failed for id_document: {e}")
                import traceback
                traceback.print_exc()
        
        # Save user with uploaded file URLs
        user.save()
        print(f"User saved with Cloudinary URLs")

        # Save general interests
        interests_added = 0
        for gid in genSkills_ids:
            try:
                GenSkill.objects.get(pk=gid)
                UserInterest.objects.get_or_create(
                    user_id=user.id,
                    genSkills_id_id=gid
                )
                interests_added += 1
            except GenSkill.DoesNotExist:
                print(f"GenSkill {gid} does not exist")
                continue

        # Save specific skills
        skills_added = 0
        for gid_str, spec_ids in specSkills.items():
            try:
                gid = int(gid_str)
                for sid in spec_ids:
                    try:
                        spec = SpecSkill.objects.get(pk=sid, genSkills_id_id=gid)
                        UserSkill.objects.get_or_create(
                            user_id=user.id,
                            specSkills_id=sid
                        )
                        skills_added += 1
                    except SpecSkill.DoesNotExist:
                        print(f"SpecSkill {sid} does not exist for GenSkill {gid}")
                        continue
            except ValueError:
                continue

        return Response({
            "message": "Registration completed successfully",
            "user_id": user.id,
            "interests_added": interests_added,
            "skills_added": skills_added,
            "profilePic_uploaded": bool(user.profilePic),
            "verification_id_uploaded": bool(id_document_file)
        }, status=201)

    except Exception as e:
        print(f"Registration error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            "error": f"Registration failed: {str(e)}"
        }, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_trade_request(request):
    """
    Create a new trade request with initial data (reqname and reqdeadline)
    """
    print("=== CREATE TRADE REQUEST DEBUG ===")
    print(f"Request data: {request.data}")
    print(f"User: {request.user.id}")
    
    reqname = request.data.get('reqname', '').strip()
    reqdeadline = request.data.get('reqdeadline', '')
    
    if not reqname:
        return Response({"error": "Service request name is required"}, status=400)
        
    if not reqdeadline:
        return Response({"error": "Request deadline is required"}, status=400)
    
    try:        
        trade_request = TradeRequest.objects.create(
            requester=request.user,
            reqname=reqname,
            reqdeadline=reqdeadline,
        )
        
        return Response({
            "message": "Trade request created successfully",
            "tradereq_id": trade_request.tradereq_id,
            "reqname": trade_request.reqname,
            "reqdeadline": trade_request.reqdeadline
        }, status=201)
        
    except Exception as e:
        print(f"Trade request creation error: {str(e)}")
        return Response({
            "error": f"Failed to create trade request: {str(e)}"
        }, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_home_active_trades(request):
    """
    Get ACTIVE and COMPLETED trades where both users have submitted trade details - for home page display.
    ✅ FILTERS OUT trades where current user has already rated (using requester_rated/responder_rated flags).
    Shows the OTHER user's information and what they're offering.
    ✅ USES database fields directly (reqname and exchange)
    ✅ FIXED: Now swaps needs/offers based on perspective
    """
    user = request.user
    
    print(f"=== GET_HOME_ACTIVE_TRADES DEBUG ===")
    print(f"User ID: {user.id}")
    
    try:
        # Get ACTIVE and COMPLETED trades where user is either requester or responder
        active_trades_query = TradeRequest.objects.filter(
            Q(status=TradeRequest.Status.ACTIVE) | Q(status=TradeRequest.Status.COMPLETED)
        ).filter(
            Q(requester=user) | Q(responder=user)
        ).select_related('requester', 'responder')
        
        # ✅ FILTER OUT trades where current user has already rated
        filtered_trades = []
        for trade in active_trades_query:
            current_user_is_requester = (trade.requester.id == user.id)
            
            # Skip if current user has already rated
            if current_user_is_requester and trade.requester_rated:
                print(f"Skipping trade {trade.tradereq_id} - requester (current user) has already rated")
                continue
            elif not current_user_is_requester and trade.responder_rated:
                print(f"Skipping trade {trade.tradereq_id} - responder (current user) has already rated")
                continue
            
            filtered_trades.append(trade)
        
        print(f"Found {len(filtered_trades)} active trades where user hasn't rated yet")
        
        # Get all trade details in one query to avoid N+1 problem
        trade_ids = [trade.tradereq_id for trade in filtered_trades]
        all_trade_details = TradeDetail.objects.filter(
            trade_request_id__in=trade_ids
        ).select_related('user', 'trade_request')
        
        # Group trade details by trade_request_id for easy lookup
        trade_details_map = {}
        for detail in all_trade_details:
            trade_id = detail.trade_request_id
            if trade_id not in trade_details_map:
                trade_details_map[trade_id] = []
            trade_details_map[trade_id].append(detail)
        
        # Filter trades where BOTH users have submitted details
        trades_with_both_details = []
        for trade in filtered_trades:
            details_for_trade = trade_details_map.get(trade.tradereq_id, [])
            user_ids_with_details = {detail.user_id for detail in details_for_trade}
            
            # Check if both requester and responder have submitted details
            if trade.requester_id in user_ids_with_details and trade.responder_id in user_ids_with_details:
                trades_with_both_details.append(trade)
                print(f"Trade {trade.tradereq_id} has both details submitted - showing in Active Trades")
        
        print(f"Found {len(trades_with_both_details)} trades with both details submitted")
        
        home_trades_data = []
        
        for trade in trades_with_both_details:
            print(f"Processing trade {trade.tradereq_id}")
            print(f"  Reqname from DB: {trade.reqname}")
            print(f"  Exchange from DB: {trade.exchange}")
            
            # Determine which user is the "other" user
            is_requester = (trade.requester.id == user.id)
            other_user = trade.responder if is_requester else trade.requester
            
            # Get the other user's trade detail
            other_user_detail = None
            details_for_trade = trade_details_map.get(trade.tradereq_id, [])
            for detail in details_for_trade:
                if detail.user_id == other_user.id:
                    other_user_detail = detail
                    break
            
            # Get profile picture URL
            profile_pic_url = other_user.profilePic if other_user.profilePic else None

             # REQUESTER perspective: I posted reqname (my need), I offer exchange (my skill)
            # RESPONDER perspective: I need to deliver reqname (what they asked for), I get exchange (their skill)
            if is_requester:
                needs = trade.reqname      # What YOU (requester) posted/need
                offers = trade.exchange    # What YOU (requester) offer in return
            else:
                # Responder sees it from their work perspective
                needs = trade.exchange     # What YOU (responder) need/want (what you'll get)
                offers = trade.reqname     # What YOU (responder) are offering (what you'll deliver)
            
            print(f"  Current user ID: {user.id}")
            print(f"  Trade requester ID: {trade.requester.id}")
            print(f"  Trade responder ID: {trade.responder.id}")
            print(f"  is_requester: {is_requester}")
            print(f"  needs (what current user needs): {needs}")
            print(f"  offers (what current user offers): {offers}")
            print(f"  ---")

            home_trades_data.append({
                "tradereq_id": trade.tradereq_id,
                "other_user": {
                    "id": other_user.id,
                    "name": f"{other_user.first_name} {other_user.last_name}".strip() or other_user.username,
                    "username": other_user.username, 
                    "profilePic": profile_pic_url,
                    "level": other_user.level,
                    "rating": float(other_user.avgStars or 0)
                },
                "reqname": needs,       # ✅ Now perspective-aware
                "exchange": offers,     # ✅ Now perspective-aware
                "total_xp": other_user_detail.total_xp if other_user_detail else 0,
                "deadline": trade.reqdeadline.isoformat() if trade.reqdeadline else None,
                "deadline_formatted": trade.reqdeadline.strftime('%B %d') if trade.reqdeadline else "No deadline",
                "is_requester": is_requester,
                "status": trade.status,
            })
        
        print(f"Returning {len(home_trades_data)} active trades")
        
        return Response({
            "home_active_trades": home_trades_data,
            "count": len(home_trades_data)
        }, status=200)
        
    except Exception as e:
        print(f"ERROR in get_home_active_trades: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            "error": f"Failed to get home active trades: {str(e)}",
            "home_active_trades": [],
            "count": 0
        }, status=500)


@api_view(["GET"])
@permission_classes([AllowAny])
def explore_feed(request):
    """
    Returns explore feed. Shows what each requester can offer based on skill matching.
    Shows: NULL status (available) and CANCELLED trades (can receive new offers)
    Hides: PENDING (locked), ACTIVE, and COMPLETED trades
    Hides: Trades where viewer already expressed interest (PENDING interest)
    """
    viewer = request.user if getattr(request.user, "id", None) else None

    # Load recent requests, exclude viewer's own requests
    # Only show trades that are open for new interests
    qs = (TradeRequest.objects
          .select_related("requester")
          .filter(
              Q(status__isnull=True) | Q(status=TradeRequest.Status.CANCELLED)
          )
          .order_by("-tradereq_id"))
    
    if viewer:
        qs = qs.exclude(requester=viewer)

        #Exclude trades where viewer already has PENDING or ACCEPTED interest
        user_interest_trade_ids = TradeInterest.objects.filter(
            interested_user=viewer,
            status__in=[TradeInterest.InterestStatus.PENDING, TradeInterest.InterestStatus.ACCEPTED]
        ).values_list('trade_request_id', flat=True)
        
        if user_interest_trade_ids:
            qs = qs.exclude(tradereq_id__in=user_interest_trade_ids)

    qs = qs[:50]

    # Preload viewer's interests if authenticated
    viewer_gen_interests = []
    if viewer:
        viewer_gen_interests = list(
            UserInterest.objects.filter(user_id=viewer.id)
            .values_list("genSkills_id_id", flat=True)
        )

    items_with_matches = []
    items_without_matches = []
    
    for tr in qs:
        requester = tr.requester
        display_name = (f"{(requester.first_name or '').strip()} {(requester.last_name or '').strip()}").strip() or requester.username

        # "Needs" = what the requester is asking for
        needs = tr.reqname

        profile_pic_url = requester.profilePic if requester.profilePic else None

        # Get all skills that the REQUESTER has (what they can offer in exchange)
        requester_skills_query = (
            UserSkill.objects.filter(user_id=tr.requester.id)
            .select_related("specSkills__genSkills_id")
            .values_list("specSkills__genSkills_id_id", "specSkills__genSkills_id__genCateg")
        )
        requester_gen_skills = dict(requester_skills_query)
                
        # Determine what the requester "can offer"
        can_offer = ""
        has_match = False
        
        # Priority 1: Find skills that the requester has AND the viewer is interested in
        if viewer and viewer_gen_interests and requester_gen_skills:
            matching_skills = set(viewer_gen_interests) & set(requester_gen_skills.keys())
            
            if matching_skills:
                matching_skill_id = list(matching_skills)[0]
                can_offer = requester_gen_skills[matching_skill_id]
                has_match = True
        
        # Priority 2: If no match, show any skill the requester has
        if not can_offer and requester_gen_skills:
            can_offer = list(requester_gen_skills.values())[0]
        
        # Priority 3: If requester has no skills, use fallback
        if not can_offer:
            any_spec = SpecSkill.objects.first()
            can_offer = any_spec.specName if any_spec else ""
        
        item_data = {
            "tradereq_id": tr.tradereq_id,
            "requester_id": requester.id,
            "name": display_name,
            "rating": float(requester.avgStars or 0),
            "ratingCount": int(requester.ratingCount or 0),
            "level": int(requester.level or 0),
            "need": needs,
            "offer": can_offer,
            "deadline": tr.reqdeadline.isoformat() if tr.reqdeadline else "",
            "profilePicUrl": profile_pic_url,  
            "userId": requester.id,
            "username": requester.username, 
        }
        
        if has_match:
            items_with_matches.append(item_data)
        else:
            items_without_matches.append(item_data)
    
    def unique_by_tradereq(items):
        seen = set()
        unique = []
        for item in items:
            if item["tradereq_id"] not in seen:
                seen.add(item["tradereq_id"])
                unique.append(item)
        return unique

    items = unique_by_tradereq(items_with_matches) + unique_by_tradereq(items_without_matches)

    return Response({"items": items}, status=200)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def express_trade_interest(request):
    """
    Express interest in a trade request.
    Creates a TradeInterest record - multiple users can express interest.
    If user was previously DECLINED or CANCELLED, reactivates their interest to PENDING.
    Does NOT change TradeRequest status - it stays NULL until requester accepts someone
    """
    print("=== EXPRESS TRADE INTEREST DEBUG ===")
    print(f"Request data: {request.data}")
    print(f"User: {request.user.id}")
    
    # Get the trade request ID from the request
    tradereq_id = request.data.get('tradereq_id')
    
    if not tradereq_id:
        return Response({"error": "Trade request ID is required."}, status=400)
    
    try:
        # Get the trade request
        trade_request = TradeRequest.objects.select_related('requester').get(
            tradereq_id=tradereq_id
        )
        
        # Validate that the user isn't trying to respond to their own request
        if trade_request.requester.id == request.user.id:
            return Response({
                "error": "You cannot express interest in your own trade request."
            }, status=400)
        
        # ✅ Check for ANY existing PENDING or ACCEPTED interest
        existing_active_interest = TradeInterest.objects.filter(
            trade_request=trade_request,
            interested_user=request.user,
            status__in=[TradeInterest.InterestStatus.PENDING, TradeInterest.InterestStatus.ACCEPTED]
        ).exists()
        
        if existing_active_interest:
            return Response({
                "error": "You have already expressed interest in this trade request."
            }, status=400)
        
        # Check if there's a DECLINED or CANCELLED interest - if so, reactivate it
        declined_interest = TradeInterest.objects.filter(
            trade_request=trade_request,
            interested_user=request.user,
            status__in=[TradeInterest.InterestStatus.DECLINED, TradeInterest.InterestStatus.CANCELLED]
        ).first()
        
        if declined_interest:
            # Reactivate the declined/cancelled interest
            declined_interest.status = TradeInterest.InterestStatus.PENDING
            declined_interest.save()
            trade_interest = declined_interest
            reactivated = True
            print(f"Reactivated declined/cancelled interest for user {request.user.id}.")
        else:
            # Create new interest record
            trade_interest = TradeInterest.objects.create(
                trade_request=trade_request,
                interested_user=request.user,
                status=TradeInterest.InterestStatus.PENDING
            )
            reactivated = False
            print(f"Created new trade interest for user {request.user.id}.")
                
        # Get total PENDING interest count (exclude declined/cancelled)
        interest_count = TradeInterest.objects.filter(
            trade_request=trade_request,
            status=TradeInterest.InterestStatus.PENDING
        ).count()
        
        # Notification to requester about new interest
        try:
            Notification.objects.create(
                recipient=trade_request.requester,
                sender=request.user,
                message=f"{request.user.first_name or request.user.username} is interested in your trade request for \"{trade_request.reqname}\"",
                notification_type=Notification.NotificationType.TRADE_INTEREST,
                link=f"/home/trades/pending/" 
            )
        except Exception as e:
            print(f"Failed to create TRADE_INTEREST notification: {e}")
        
        print(f"Trade status remains: {trade_request.status} (unchanged)")
        print(f"Requester: {trade_request.requester.username}")
        print(f"Interested User: {request.user.username}")
        print(f"Total pending interests: {interest_count}")
        
        return Response({
            "message": "Interest expressed successfully",
            "tradereq_id": trade_request.tradereq_id,
            "requester": {
                "id": trade_request.requester.id,
                "name": f"{trade_request.requester.first_name} {trade_request.requester.last_name}".strip() or trade_request.requester.username,
                "username": trade_request.requester.username
            },
            "interested_user": {
                "id": request.user.id,
                "name": f"{request.user.first_name} {request.user.last_name}".strip() or request.user.username,
                "username": request.user.username
            },
            "total_interests": interest_count,
            "reqname": trade_request.reqname,
            "created_at": trade_interest.created_at,
            "reactivated": reactivated
        }, status=201)
        
    except TradeRequest.DoesNotExist:
        return Response({
            "error": "Trade request not found"
        }, status=404)
        
    except Exception as e:
        print(f"Express interest error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            "error": f"Failed to express interest: {str(e)}"
        }, status=500)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_trade_interests(request, tradereq_id):
    """
    Get all users who expressed interest in a trade request
    """
    try:
        trade_request = TradeRequest.objects.get(tradereq_id=tradereq_id)
        interests = TradeInterest.objects.filter(trade_request=trade_request).select_related('interested_user')
        
        interests_data = []
        for interest in interests:
            user = interest.interested_user

            profile_pic_url = user.profilePic if user.profilePic else None

            interests_data.append({
                "user_id": user.id,
                "interest_id": interest.trade_interests_id,
                "status": interest.status,  
                "name": f"{user.first_name} {user.last_name}".strip() or user.username,
                "username": user.username,
                "level": user.level,
                "rating": float(user.avgStars or 0),
                "rating_count": user.ratingCount,
                "profilePic": profile_pic_url,
                "created_at": interest.created_at,
            })
        
        return Response({
            "trade_request": {
                "tradereq_id": trade_request.tradereq_id,
                "reqname": trade_request.reqname,
                "requester": trade_request.requester.username
            },
            "interests": interests_data,
            "total_count": len(interests_data)
        }, status=200)
        
    except TradeRequest.DoesNotExist:
        return Response({"error": "Trade request not found"}, status=404)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_posted_trades(request):
    """
    Get all trades posted by the authenticated user with interested users.
    """
    user = request.user
    
    posted_trades = TradeRequest.objects.filter(
        requester=user
    ).exclude(
        status__in=[TradeRequest.Status.ACTIVE, TradeRequest.Status.COMPLETED]
    ).prefetch_related(
        'interests__interested_user'
    ).order_by('-tradereq_id')
    
    # Get requester's skills
    requester_skills = {}
    user_skills = UserSkill.objects.filter(user=user).select_related('specSkills__genSkills_id')
    for skill in user_skills:
        gen_category = skill.specSkills.genSkills_id.genCateg
        if gen_category not in requester_skills:
            requester_skills[gen_category] = []
        requester_skills[gen_category].append(skill.specSkills.specName)
    
    trades_data = []
    
    for trade in posted_trades:
        # Get PENDING interested users (for display)
        interested_users = []
        accepted_user = None  # Store the accepted user separately
        
        for interest in trade.interests.all():
            interested_user = interest.interested_user
            
            # ✅ Convert to list immediately
            user_interests_list = list(
                UserInterest.objects.filter(
                    user=interested_user
                ).select_related('genSkills_id').values_list('genSkills_id__genCateg', flat=True)
            )
            
            matching_skill = None
            for gen_category, spec_skills in requester_skills.items():
                if gen_category in user_interests_list:
                    matching_skill = gen_category
                    break

            if not matching_skill and requester_skills:
                matching_skill = list(requester_skills.keys())[0]
            elif not matching_skill:
                any_skill = GenSkill.objects.first()
                matching_skill = any_skill.genCateg if any_skill else "Skills & Services"
            
            profile_pic_url = interested_user.profilePic if interested_user.profilePic else None

            user_data = {
                "id": interested_user.id,
                "interest_id": interest.trade_interests_id,
                "status": interest.status,
                "name": f"{interested_user.first_name} {interested_user.last_name}".strip() or interested_user.username,
                "username": interested_user.username,
                "level": interested_user.level,
                "rating": float(interested_user.avgStars or 0),
                "rating_count": interested_user.ratingCount,
                "profilePic": profile_pic_url,
                "created_at": interest.created_at.isoformat(),
                "interests": user_interests_list,  # ✅ Now a list, not QuerySet
                "matching_skill": matching_skill, 
            }
            
            # Separate PENDING and ACCEPTED users
            if interest.status == TradeInterest.InterestStatus.ACCEPTED:
                accepted_user = user_data
            elif interest.status == TradeInterest.InterestStatus.PENDING:
                interested_users.append(user_data)
        
        trades_data.append({
            "tradereq_id": trade.tradereq_id,
            "reqname": trade.reqname,
            "deadline": trade.reqdeadline.isoformat() if trade.reqdeadline else "",
            "status": trade.status,
            "interested_users": interested_users,  # Only PENDING users
            "accepted_user": accepted_user,  # The accepted user (if any)
            "interest_count": len(interested_users),
            "created_at": trade.created_at if hasattr(trade, 'created_at') else None,
            "requester_skills": requester_skills,  
        })
    
    return Response({
        "posted_trades": trades_data,
        "count": len(trades_data)
    }, status=200)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_trade_request(request, tradereq_id):
    """
    Delete a trade request - only the requester can delete their own posts
    """
    try:
        trade_request = TradeRequest.objects.get(
            tradereq_id=tradereq_id,
            requester=request.user
        )
        
        # Check if trade has any accepted interests (shouldn't delete if someone already accepted)
        has_accepted_interests = TradeInterest.objects.filter(
            trade_request=trade_request,
            status=TradeInterest.InterestStatus.ACCEPTED
        ).exists()
        
        if has_accepted_interests:
            return Response({
                "error": "Cannot delete trade request that has been accepted by someone"
            }, status=400)
        
        # Delete related messaging and details explicitly for safety
        try:
            Conversation.objects.filter(trade_request=trade_request).delete()
        except Exception as e:
            print(f"Warning: failed deleting conversations for trade {tradereq_id}: {e}")

        try:
            TradeDetail.objects.filter(trade_request=trade_request).delete()
        except Exception as e:
            print(f"Warning: failed deleting trade details for trade {tradereq_id}: {e}")

        try:
            TradeInterest.objects.filter(trade_request=trade_request).delete()
        except Exception as e:
            print(f"Warning: failed deleting trade interests for trade {tradereq_id}: {e}")

        # Delete the trade request (cascade should handle remaining relations)
        trade_request.delete()
        
        return Response({
            "message": "Trade request deleted successfully",
            "tradereq_id": tradereq_id
        }, status=200)
        
    except TradeRequest.DoesNotExist:
        return Response({
            "error": "Trade request not found or you don't have permission to delete it"
        }, status=404)
    except Exception as e:
        print(f"Delete trade request error: {str(e)}")
        return Response({
            "error": f"Failed to delete trade request: {str(e)}"
        }, status=500)
    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def decline_trade_interest(request, interest_id):
    """
    Decline a trade interest - sets status to DECLINED
    Only the requester (who posted the trade) can decline
    If no more pending interests remain, revert trade status to null
    """
    print(f"=== DECLINE TRADE INTEREST DEBUG ===")
    print(f"Interest ID: {interest_id}")
    print(f"User: {request.user.id}")
    
    try:
        # Get the trade interest with related objects
        trade_interest = TradeInterest.objects.select_related(
            'trade_request__requester',
            'interested_user'
        ).get(trade_interests_id=interest_id)
        
        # Check if the current user is the requester (owner of the trade)
        if trade_interest.trade_request.requester.id != request.user.id:
            return Response({
                "error": "Only the trade requester can decline interests"
            }, status=403)
        
        # Check if already processed
        if trade_interest.status != TradeInterest.InterestStatus.PENDING:
            return Response({
                "error": f"This interest has already been {trade_interest.status.lower()}"
            }, status=400)
        
        with transaction.atomic():
            # Update status to DECLINED
            trade_interest.status = TradeInterest.InterestStatus.DECLINED
            trade_interest.save()
            
            # ✅ CHECK IF ANY PENDING INTERESTS REMAIN
            remaining_pending_interests = TradeInterest.objects.filter(
                trade_request=trade_interest.trade_request,
                status=TradeInterest.InterestStatus.PENDING
            ).count()
            
            print(f"Remaining pending interests: {remaining_pending_interests}")
            
            # ✅ IF NO PENDING INTERESTS REMAIN, REVERT TRADE STATUS TO NULL
            if remaining_pending_interests == 0:
                trade_request = trade_interest.trade_request
                trade_request.status = None  # Revert to null/no status
                trade_request.save()
                print(f"Trade {trade_request.tradereq_id} status reverted to NULL - no pending interests remain")
        
        print(f"Trade interest {interest_id} declined successfully")
        
        return Response({
            "message": "Trade interest declined successfully",
            "interest_id": trade_interest.trade_interests_id,
            "status": trade_interest.status,
            "trade_request": {
                "tradereq_id": trade_interest.trade_request.tradereq_id,
                "reqname": trade_interest.trade_request.reqname,
                "status": trade_interest.trade_request.status,  # Will be None if reverted
                "reverted_to_explore": remaining_pending_interests == 0
            },
            "interested_user": {
                "id": trade_interest.interested_user.id,
                "name": f"{trade_interest.interested_user.first_name} {trade_interest.interested_user.last_name}".strip() or trade_interest.interested_user.username
            },
            "remaining_pending_interests": remaining_pending_interests
        }, status=200)
        
    except TradeInterest.DoesNotExist:
        return Response({
            "error": "Trade interest not found"
        }, status=404)
        
    except Exception as e:
        print(f"Decline interest error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            "error": f"Failed to decline interest: {str(e)}"
        }, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def accept_trade_interest(request, interest_id):
    """
    Accept a trade interest - sets interest status to ACCEPTED but keeps trade as PENDING
    Trade only becomes ACTIVE after evaluation confirmation
    This is where TradeRequest status becomes PENDING (locked)
    """
    print(f"=== ACCEPT TRADE INTEREST DEBUG ===")
    print(f"Interest ID: {interest_id}")
    print(f"User: {request.user.id}")
    
    try:
        with transaction.atomic():
            # Get the trade interest with related objects
            trade_interest = TradeInterest.objects.select_related(
                'trade_request__requester',
                'interested_user'
            ).get(trade_interests_id=interest_id)
            
            # Check if the current user is the requester (owner of the trade)
            if trade_interest.trade_request.requester.id != request.user.id:
                return Response({
                    "error": "Only the trade requester can accept interests"
                }, status=403)
            
            # Check if already processed
            if trade_interest.status != TradeInterest.InterestStatus.PENDING:
                return Response({
                    "error": f"This interest has already been {trade_interest.status.lower()}"
                }, status=400)
            
            # Check if the trade is still available for acceptance
            trade_request = trade_interest.trade_request
            if trade_request.status == TradeRequest.Status.ACTIVE:
                return Response({
                    "error": "This trade has already been accepted by someone else"
                }, status=400)
            
            # Update the trade interest status to ACCEPTED
            trade_interest.status = TradeInterest.InterestStatus.ACCEPTED
            trade_interest.save()
            
            # NOW set trade to PENDING (locked, no more offers)
            trade_request.status = TradeRequest.Status.PENDING
            trade_request.responder = trade_interest.interested_user
            
            print(f"Setting responder to user ID: {trade_interest.interested_user.id}")
            print(f"Requester ID: {trade_request.requester.id}")
            print(f"Trade status set to: {trade_request.status}")
            
            # 🔧 IMPROVED: Calculate exchange field using better logic
            requester = trade_request.requester
            responder = trade_interest.interested_user
            
            # Get REQUESTER's skills with full details
            requester_skills = UserSkill.objects.filter(
                user=requester
            ).select_related("specSkills__genSkills_id")
            
            requester_gen_skills = {}
            requester_spec_skills = []
            
            for skill in requester_skills:
                if skill.specSkills:
                    requester_spec_skills.append(skill.specSkills.specName)
                    if skill.specSkills.genSkills_id:
                        gen_skill_obj = skill.specSkills.genSkills_id
                        requester_gen_skills[gen_skill_obj.genSkills_id] = gen_skill_obj.genCateg

            # Get RESPONDER's interests
            responder_interests = UserInterest.objects.filter(
                user=responder
            ).values_list('genSkills_id_id', flat=True)
            
            exchange_skill = ""
            
            # Priority 1: Match requester's skills with responder's interests
            if responder_interests and requester_gen_skills:
                matching_skill_ids = set(responder_interests) & set(requester_gen_skills.keys())
                if matching_skill_ids:
                    matching_skill_id = list(matching_skill_ids)[0]
                    exchange_skill = requester_gen_skills[matching_skill_id]
            
            # Priority 2: Check if specific skills match the request
            if not exchange_skill and requester_spec_skills:
                reqname_lower = trade_request.reqname.lower()
                for spec_skill in requester_spec_skills:
                    if spec_skill.lower() in reqname_lower:
                        for skill in requester_skills:
                            if skill.specSkills and skill.specSkills.specName == spec_skill:
                                if skill.specSkills.genSkills_id:
                                    exchange_skill = skill.specSkills.genSkills_id.genCateg
                                    break
                        if exchange_skill:
                            break
            
            # Priority 3: Use first skill category
            if not exchange_skill and requester_gen_skills:
                exchange_skill = list(requester_gen_skills.values())[0]
            
            # Priority 4: Fallback
            if not exchange_skill:
                any_spec = SpecSkill.objects.first()
                can_offer = any_spec.specName if any_spec else ""
            
            # Save the exchange field
            trade_request.exchange = exchange_skill
            trade_request.save()
            
            # Force refresh to ensure the save worked
            trade_request.refresh_from_db()
            
            # Verify the responder was set correctly
            if not trade_request.responder:
                raise Exception("Failed to set responder for trade request")
            
            print(f"Exchange field saved: {exchange_skill}")
            print(f"Trade saved with requester ID: {trade_request.requester.id}, responder ID: {trade_request.responder.id}")
            print(f"VERIFICATION - Reloaded trade: requester={trade_request.requester.id}, responder={trade_request.responder.id}")
            
            print(f"Trade interest {interest_id} accepted successfully")
            print(f"Trade {trade_request.tradereq_id} is now PENDING (waiting for evaluation)")
            print(f"Exchange field set to: {trade_request.exchange}")

            # Ensure a conversation exists for this trade
            convo, _ = Conversation.objects.get_or_create(
                trade_request=trade_request,
                defaults={
                    'requester': trade_request.requester,
                    'responder': trade_request.responder,
                }
            )
            
            # Notification to interested user about acceptance
            try:
                Notification.objects.create(
                    recipient=trade_interest.interested_user, # Notify the user who was accepted
                    sender=request.user, # The requester
                    message=f"{request.user.first_name or request.user.username} accepted your trade for \"{trade_request.reqname}\". Add details to the trade now!",
                    notification_type=Notification.NotificationType.TRADE_ACCEPTED,
                    link=f"/home/trades/pending/"
                )
            except Exception as e:
                print(f"Failed to create TRADE_ACCEPTED notification: {e}")

            return Response({
                "message": "Trade interest accepted successfully - proceed to evaluation",
                "interest_id": trade_interest.trade_interests_id,
                "interest_status": trade_interest.status,
                "trade_request": {
                    "tradereq_id": trade_request.tradereq_id,
                    "reqname": trade_request.reqname,
                    "status": trade_request.status,
                    "exchange": trade_request.exchange,
                    "requester_id": trade_request.requester.id,
                    "responder_id": trade_request.responder.id if trade_request.responder else None,
                    "responder": {
                        "id": trade_request.responder.id,
                        "name": f"{trade_request.responder.first_name} {trade_request.responder.last_name}".strip() or trade_request.responder.username
                    },
                    "requires_evaluation": True
                },
                "conversation_id": getattr(convo, 'conversation_id', None),
            }, status=200)
            
    except TradeInterest.DoesNotExist:
        return Response({
            "error": "Trade interest not found"
        }, status=404)
        
    except Exception as e:
        print(f"Accept interest error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            "error": f"Failed to accept interest: {str(e)}"
        }, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def check_user_interests(request):
    """
    Check if current user has expressed interest in multiple trades
    Body: { "trade_ids": [1, 2, 3] }
    Returns: { "interests": { "1": "PENDING", "2": "ACCEPTED", "3": null } }
    """
    trade_ids = request.data.get('trade_ids', [])
    
    if not trade_ids:
        return Response({"interests": {}}, status=200)
    
    # Get all interests for current user for these trades
    interests = TradeInterest.objects.filter(
        trade_request_id__in=trade_ids,
        interested_user=request.user
    ).values('trade_request_id', 'status')
    
    # Build response dict
    result = {}
    for trade_id in trade_ids:
        result[str(trade_id)] = None
    
    for interest in interests:
        result[str(interest['trade_request_id'])] = interest['status']
    
    return Response({"interests": result}, status=200)

@api_view(['GET'])
@permission_classes([IsAuthenticated])  
def get_user_posted_trades(request, username):
    """
    Ensure posted_trades returns offer as a specific specName if available.
    """
    try:
        user = CustomUser.objects.get(username=username)
    except CustomUser.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    posted_trades = TradeRequest.objects.filter(requester=user).order_by('-tradereq_id')

    # Precompute a fallback specific skill (never generic text)
    any_spec = SpecSkill.objects.first()
    fallback_spec_name = getattr(any_spec, "specName", "") if any_spec else ""

    trades_data = []
    for t in posted_trades:
        # Prefer a specific user skill name from userskills_tbl
        offer = ""
        spec_name = ""
        try:
            first_us = UserSkill.objects.filter(user_id=user.id).select_related("specSkills__genSkills_id").first()
            if first_us and getattr(first_us, "specSkills", None):
                spec = first_us.specSkills
                spec_name = getattr(spec, "specName", None) or ""
                gen = getattr(spec, "genSkills_id", None)
                gen_categ = getattr(gen, "genCateg", None) if gen else ""
                offer = spec_name or gen_categ or ""
        except Exception:
            offer = ""

        # Fallback to any spec skill in DB
        if not offer:
            offer = fallback_spec_name
            spec_name = spec_name or fallback_spec_name

        trades_data.append({
            "tradereq_id": t.tradereq_id,
            "reqname": t.reqname,
            "deadline": t.reqdeadline.isoformat() if t.reqdeadline else "",
            "status": t.status,
            "offer": offer,
            "specName": spec_name,
            "created_at": t.created_at,
        })

    return Response({
        "posted_trades": trades_data,
        "count": len(trades_data)
    }, status=200)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_active_trades(request):
    """
    Get all PENDING trades where the authenticated user is either requester or responder.
    ✅ USES database fields directly (reqname and exchange)
    """
    user = request.user
    
    print(f"=== GET_ACTIVE_TRADES DEBUG ===")
    print(f"User ID: {user.id}")
    
    try:
        active_trades = TradeRequest.objects.filter(
            status=TradeRequest.Status.PENDING
        ).filter(
            Q(requester=user) | Q(responder=user)
        ).select_related('requester', 'responder').order_by('-tradereq_id')
        
        print(f"Found {active_trades.count()} PENDING trades")
        
        trades_data = []
        
        for trade in active_trades:
            if not trade.responder:
                print(f"Skipping trade {trade.tradereq_id} - no responder")
                continue
            
            # Determine which user is the "other" user and if current user is the requester
            is_requester = (trade.requester.id == user.id)
            other_user = trade.responder if is_requester else trade.requester
            
            # Determine the correct 'needs' and 'offers' from the current user's point of view.
            if is_requester:
                # As the requester, I NEED the original request .
                # The OFFER is what I give in exchange.
                user_perspective_needs = trade.reqname
                user_perspective_offers = trade.exchange
            else:
                # As the responder, I NEED the exchange.
                # The OFFER I am providing is the original request.
                user_perspective_needs = trade.exchange
                user_perspective_offers = trade.reqname
            
            print(f"Trade {trade.tradereq_id}:")
            print(f"  Reqname from DB: {trade.reqname}")
            print(f"  Exchange from DB: {trade.exchange}")
            print(f"  Current user is requester: {is_requester}")
            
            # Get profile picture URL
            profile_pic_url = other_user.profilePic if other_user.profilePic else None
            
            trades_data.append({
                "id": trade.tradereq_id,
                "trade_request_id": trade.tradereq_id,
                "name": f"{other_user.first_name} {other_user.last_name}".strip() or other_user.username,
                "rating": float(other_user.avgStars or 0),
                "reviews": str(other_user.ratingCount or 0),
                "level": str(other_user.level or 1),
                "needs": user_perspective_needs,  # ✅ Direct from database - what requester needs
                "offers": user_perspective_offers,  # ✅ Direct from database - what's offered in exchange
                "until": trade.reqdeadline.strftime('%B %d') if trade.reqdeadline else "No deadline",
                "status": "PENDING",
                "other_user_profile_pic": profile_pic_url,  
                "is_requester": is_requester,
                "created_at": None,
                "requester": {
                    "id": trade.requester.id,
                    "username": trade.requester.username,
                    "name": f"{trade.requester.first_name} {trade.requester.last_name}".strip() or trade.requester.username
                },
                "responder": {
                    "id": trade.responder.id,
                    "username": trade.responder.username,
                    "name": f"{trade.responder.first_name} {trade.responder.last_name}".strip() or trade.responder.username
                },
                "other_user": {
                    "id": other_user.id,
                    "username": other_user.username,
                    "name": f"{other_user.first_name} {other_user.last_name}".strip() or other_user.username
                }
            })
        
        print(f"Returning {len(trades_data)} active trades")
        
        return Response({
            "active_trades": trades_data,
            "count": len(trades_data)
        }, status=200)
        
    except Exception as e:
        print(f"ERROR in get_active_trades: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            "error": f"Failed to get active trades: {str(e)}",
            "active_trades": [],
            "count": 0
        }, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_evaluation_details(request, tradereq_id):
    """
    Get evaluation details for a trade request.
    Creates evaluation if both users have submitted trade details.
    """
    try:
        trade_request = TradeRequest.objects.select_related('requester', 'responder').get(
            tradereq_id=tradereq_id
        )
        
        # Verify user is part of this trade
        if request.user not in [trade_request.requester, trade_request.responder]:
            return Response({
                "error": "You are not authorized to view this evaluation"
            }, status=403)
        
        # Check if both users have submitted details
        trade_details = TradeDetail.objects.filter(trade_request=trade_request)
        requester_detail = trade_details.filter(user=trade_request.requester).first()
        responder_detail = trade_details.filter(user=trade_request.responder).first()
        
        if not (requester_detail and responder_detail):
            return Response({
                "error": "Both users must submit trade details before evaluation"
            }, status=400)
        
        # Calculate evaluation scores based on trade details
        def calculate_complexity(req_detail, resp_detail):
            complexity_map = {
                TradeDetail.RequestType.OUTPUT: 40,
                TradeDetail.RequestType.SERVICE: 60,
                TradeDetail.RequestType.PROJECT: 80,
            }
            req_complexity = complexity_map.get(req_detail.reqtype, 50)
            resp_complexity = complexity_map.get(resp_detail.reqtype, 50)
            return min(100, max(20, (req_complexity + resp_complexity) // 2))
        
        def calculate_time_commitment(req_detail, resp_detail):
            time_map = {
                TradeDetail.RequestType.OUTPUT: 30,
                TradeDetail.RequestType.SERVICE: 50,
                TradeDetail.RequestType.PROJECT: 80,
            }
            req_time = time_map.get(req_detail.reqtype, 40)
            resp_time = time_map.get(resp_detail.reqtype, 40)
            return min(100, max(20, (req_time + resp_time) // 2))
        
        def calculate_skill_level(req_detail, resp_detail):
            skill_map = {
                TradeDetail.SkillProficiency.BEGINNER: 40,
                TradeDetail.SkillProficiency.INTERMEDIATE: 60,
                TradeDetail.SkillProficiency.ADVANCED: 80,
                TradeDetail.SkillProficiency.CERTIFIED: 90,
            }
            req_skill = skill_map.get(req_detail.skillprof, 50)
            resp_skill = skill_map.get(resp_detail.skillprof, 50)
            return min(100, max(20, (req_skill + resp_skill) // 2))
        
        # Calculate dynamic values
        task_complexity = calculate_complexity(requester_detail, responder_detail)
        time_commitment = calculate_time_commitment(requester_detail, responder_detail)
        skill_level = calculate_skill_level(requester_detail, responder_detail)
        
        # Generate dynamic feedback
        complexity_desc = "challenging" if task_complexity > 70 else "moderate" if task_complexity > 40 else "simple"
        time_desc = "high" if time_commitment > 70 else "moderate" if time_commitment > 40 else "low"
        skill_desc = "advanced" if skill_level > 70 else "intermediate" if skill_level > 40 else "basic"
        
        dynamic_feedback = (
            f"This trade between {trade_request.requester.first_name} and {trade_request.responder.first_name} "
            f"involves {complexity_desc} tasks with {time_desc} time commitment and requires {skill_desc} skill levels. "
            f"The exchange of {trade_request.reqname} for {trade_request.exchange} offers valuable learning opportunities "
            f"for both parties and represents a well-balanced trade arrangement."
        )
        
        # Get or create evaluation with calculated values
        evaluation, created = Evaluation.objects.get_or_create(
            trade_request=trade_request,
            defaults={
                'taskcomplexity': task_complexity,
                'timecommitment': time_commitment,
                'skilllevel': skill_level,
                'evaluationdescription': dynamic_feedback
            }
        )
        
        # If evaluation already exists but was created with defaults, update it
        if not created and evaluation.evaluationdescription.startswith("Trade evaluation for"):
            evaluation.taskcomplexity = task_complexity
            evaluation.timecommitment = time_commitment
            evaluation.skilllevel = skill_level
            evaluation.evaluationdescription = dynamic_feedback
            evaluation.save()
        
        print(f"Evaluation data: complexity={task_complexity}, time={time_commitment}, skill={skill_level}")
        
        return Response({
            "evaluation": {
                "tradereq_id": trade_request.tradereq_id,
                "requestTitle": trade_request.reqname,
                "offerTitle": trade_request.exchange,
                "taskComplexity": evaluation.taskcomplexity,
                "timeCommitment": evaluation.timecommitment,
                "skillLevel": evaluation.skilllevel,
                "tradeScore": min(10, max(1, (evaluation.taskcomplexity + evaluation.timecommitment + evaluation.skilllevel) // 30)),
                "feedback": evaluation.evaluationdescription,
                "requester_evaluation_status": evaluation.requester_evaluation_status,
                "responder_evaluation_status": evaluation.responder_evaluation_status,
                "both_users_responded": (
                    evaluation.requester_evaluation_status is not None and 
                    evaluation.responder_evaluation_status is not None
                )
            },
            "current_user_response": (
                evaluation.requester_evaluation_status if request.user == trade_request.requester 
                else evaluation.responder_evaluation_status
            ),
            "can_respond": (
                evaluation.requester_evaluation_status is None if request.user == trade_request.requester
                else evaluation.responder_evaluation_status is None
            )
        }, status=200)
        
    except TradeRequest.DoesNotExist:
        return Response({"error": "Trade request not found"}, status=404)
    except Exception as e:
        print(f"Error in get_evaluation_details: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"error": f"Failed to get evaluation details: {str(e)}"}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def confirm_trade_evaluation(request, tradereq_id):
    """
    Confirm trade after evaluation - stores user's CONFIRMED response
    """
    print(f"=== CONFIRM TRADE EVALUATION DEBUG ===")
    print(f"Trade ID: {tradereq_id}")
    print(f"User: {request.user.id}")
    
    try:
        trade_request = TradeRequest.objects.select_related('requester', 'responder').get(
            tradereq_id=tradereq_id
        )
        
        if request.user not in [trade_request.requester, trade_request.responder]:
            return Response({"error": "You are not authorized to confirm this trade"}, status=403)
        
        # Get the evaluation
        evaluation = Evaluation.objects.filter(trade_request=trade_request).first()
        if not evaluation:
            return Response({"error": "No evaluation found for this trade"}, status=404)
        
        print(f"Current evaluation status:")
        print(f"  Requester status: {evaluation.requester_evaluation_status}")
        print(f"  Responder status: {evaluation.responder_evaluation_status}")
        print(f"  Current user is requester: {request.user == trade_request.requester}")
        
        with transaction.atomic():
            # Set user's evaluation status to CONFIRMED
            if request.user == trade_request.requester:
                if evaluation.requester_evaluation_status is not None:
                    return Response({"error": "You have already responded to this evaluation"}, status=400)
                evaluation.requester_evaluation_status = Evaluation.EvaluationStatus.CONFIRMED
                evaluation.requester_responded_at = django_timezone.now()
                print(f"Set requester status to CONFIRMED")
            else:  # responder
                if evaluation.responder_evaluation_status is not None:
                    return Response({"error": "You have already responded to this evaluation"}, status=400)
                evaluation.responder_evaluation_status = Evaluation.EvaluationStatus.CONFIRMED
                evaluation.responder_responded_at = django_timezone.now()
                print(f"Set responder status to CONFIRMED")
            
            evaluation.save()
            print(f"Evaluation saved successfully")
            
            # Notification to the other user about confirmation
            partner_user = None
            if request.user == trade_request.requester:
                partner_user = trade_request.responder
            else:
                partner_user = trade_request.requester
            
            try:
                Notification.objects.create(
                    recipient=partner_user, # Notify the partner
                    sender=request.user,
                    message=f"{request.user.first_name or request.user.username} confirmed your trade for \"{trade_request.reqname}\"",
                    notification_type=Notification.NotificationType.TRADE_CONFIRMED,
                    link=f"/home/trades/active/"
                )
            except Exception as e:
                print(f"Failed to create TRADE_CONFIRMED notification: {e}")
                
            # Check if both users have confirmed
            both_confirmed = (
                evaluation.requester_evaluation_status == Evaluation.EvaluationStatus.CONFIRMED and 
                evaluation.responder_evaluation_status == Evaluation.EvaluationStatus.CONFIRMED
            )
            
            print(f"Both users confirmed: {both_confirmed}")
            
            if both_confirmed:
                # Both confirmed - activate trade
                trade_request.status = TradeRequest.Status.ACTIVE
                trade_request.save()

                # Decline all other pending interests
                other_interests = TradeInterest.objects.filter(
                    trade_request=trade_request,
                    status=TradeInterest.InterestStatus.PENDING
                )
                declined_count = other_interests.update(status=TradeInterest.InterestStatus.DECLINED)
    

                print(f"Trade status set to ACTIVE")
                message = "Trade confirmed by both parties! Trade is now active."
                trade_status = "ACTIVE"
            else:
                # Waiting for other user
                other_user_name = (trade_request.responder.first_name if request.user == trade_request.requester 
                                 else trade_request.requester.first_name)
                message = f"Your confirmation recorded. Waiting for {other_user_name} to respond."
                trade_status = "PENDING"
                print(f"Waiting for other user: {other_user_name}")
        
        return Response({
            "message": message,
            "tradereq_id": trade_request.tradereq_id,
            "trade_status": trade_status,
            "user_response": "CONFIRMED",
            "both_users_confirmed": both_confirmed,
            "evaluation_id": evaluation.evaluation_id
        }, status=200)
        
    except TradeRequest.DoesNotExist:
        return Response({"error": "Trade request not found"}, status=404)
    except Exception as e:
        print(f"Error confirming trade: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"error": f"Failed to confirm trade: {str(e)}"}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reject_trade_evaluation(request, tradereq_id):
    """
    Reject trade after evaluation - stores user's REJECTED response and cancels trade
    """
    print(f"=== REJECT TRADE EVALUATION DEBUG ===")
    print(f"Trade ID: {tradereq_id}")
    print(f"User: {request.user.id}")
    
    try:
        trade_request = TradeRequest.objects.select_related('requester', 'responder').get(
            tradereq_id=tradereq_id
        )
        
        if request.user not in [trade_request.requester, trade_request.responder]:
            return Response({"error": "You are not authorized to reject this trade"}, status=403)
        
        evaluation = Evaluation.objects.filter(trade_request=trade_request).first()
        if not evaluation:
            return Response({"error": "No evaluation found for this trade"}, status=404)
        
        with transaction.atomic():
            # Set user's evaluation status to REJECTED
            if request.user == trade_request.requester:
                if evaluation.requester_evaluation_status is not None:
                    return Response({"error": "You have already responded to this evaluation"}, status=400)
                evaluation.requester_evaluation_status = Evaluation.EvaluationStatus.REJECTED
                evaluation.requester_responded_at = django_timezone.now()   
            else:  # responder
                if evaluation.responder_evaluation_status is not None:
                    return Response({"error": "You have already responded to this evaluation"}, status=400)
                evaluation.responder_evaluation_status = Evaluation.EvaluationStatus.REJECTED
                evaluation.responder_responded_at = django_timezone.now()
            
            evaluation.save()
            print(f"Evaluation rejection saved")
            
            # Any rejection cancels the trade immediately
            trade_request.status = TradeRequest.Status.CANCELLED
            trade_request.save()
            print(f"Trade status set to CANCELLED")
        
        return Response({
            "message": "Trade rejected successfully. Trade has been cancelled.",
            "tradereq_id": trade_request.tradereq_id,
            "trade_status": "CANCELLED",
            "user_response": "REJECTED",
            "evaluation_id": evaluation.evaluation_id
        }, status=200)
        
    except TradeRequest.DoesNotExist:
        return Response({"error": "Trade request not found"}, status=404)
    except Exception as e:
        print(f"Error rejecting trade: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"error": f"Failed to reject trade: {str(e)}"}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_active_trade(request, tradereq_id):
    """
    Cancel an active trade via 3-dots menu
    - Sets TradeInterest status to CANCELLED
    - Reverts TradeRequest status to NULL (available for new offers)
    - Clears responder_id (resets to NULL)
    - Clears exchange field (resets to NULL)
    - ✅ NEW: Optionally soft-deletes the conversation for both users
    """
    print(f"=== CANCEL ACTIVE TRADE DEBUG ===")
    print(f"Trade ID: {tradereq_id}")
    print(f"User: {request.user.id}")
    
    try:
      
        trade_request = TradeRequest.objects.get(tradereq_id=tradereq_id)
        
        # Verify user is authorized (either requester or responder)
        if request.user not in [trade_request.requester, trade_request.responder]:
            return Response({
                "error": "You are not authorized to cancel this trade"
            }, status=403)
        
        with transaction.atomic():
            # Store responder before clearing it (for conversation cleanup)
            old_responder = trade_request.responder
            
            # Set TradeInterest to CANCELLED if it exists
            trade_interest = TradeInterest.objects.filter(
                trade_request=trade_request,
                status=TradeInterest.InterestStatus.ACCEPTED
            ).first()
            
            if trade_interest:
                trade_interest.status = TradeInterest.InterestStatus.CANCELLED
                trade_interest.save()
                print(f"Set TradeInterest {trade_interest.trade_interests_id} to CANCELLED")
            
            # ✅ REVERT TRADE STATUS TO NULL (available for new offers)
            trade_request.status = None
            trade_request.responder = None
            trade_request.exchange = None
            trade_request.save()
            
            print(f"Trade {tradereq_id} reverted to NULL status")
            
            # Soft-delete the conversation for both users
            conversation = Conversation.objects.filter(trade_request=trade_request).first()
            if conversation:
                # Delete for the user who cancelled
                DeletedConversation.objects.get_or_create(
                    conversation=conversation,
                    user=request.user
                )
                
        
        return Response({
            "message": "Trade cancelled successfully. Trade is now available for new offers.",
            "tradereq_id": trade_request.tradereq_id,
            "status": None,
            "responder_id": None,
            "exchange": None,
            "reverted_to_explore": True,
            "conversation_deleted": True  # Conversation removed from both users' lists
        }, status=200)
        
    except TradeRequest.DoesNotExist:
        return Response({
            "error": "Trade request not found"
        }, status=404)
    except Exception as e:
        print(f"Cancel trade error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            "error": f"Failed to cancel trade: {str(e)}"
        }, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_trade_details(request, tradereq_id):
    """
    Get trade details for a specific trade request (GET only version)
    """
    try:
        trade_request = TradeRequest.objects.select_related('requester', 'responder').get(
            tradereq_id=tradereq_id
        )
        
        # Verify user is part of this trade
        if request.user not in [trade_request.requester, trade_request.responder]:
            return Response({
                "error": "You are not authorized to view details for this trade"
            }, status=403)
        
        # Get all trade details for this trade request
        trade_details = TradeDetail.objects.filter(
            trade_request=trade_request
        ).select_related('user')
        
        details_data = []
        for detail in trade_details:
            context_pic_url = detail.contextpic if detail.contextpic else None
            
            details_data.append({
                "user_id": detail.user.id,
                "user_name": f"{detail.user.first_name} {detail.user.last_name}".strip() or detail.user.username,
                "skillprof": detail.skillprof,
                "modedel": detail.modedel,
                "reqtype": detail.reqtype,
                "reqbio": detail.reqbio,
                "contextpic": context_pic_url,
                "total_xp": detail.total_xp,
                "created_at": detail.created_at,
            })
        
        return Response({
            "details": details_data,
            "user_has_submitted": any(d["user_id"] == request.user.id for d in details_data),
            "both_submitted": len(details_data) >= 2
        }, status=200)
        
    except TradeRequest.DoesNotExist:
        return Response({
            "error": "Trade request not found"
        }, status=404)
        
    except Exception as e:
        print(f"Get trade details error: {str(e)}")
        return Response({
            "error": f"Failed to get trade details: {str(e)}"
        }, status=500)
    
@api_view(['POST', 'GET'])
@parser_classes([MultiPartParser, FormParser, JSONParser])
@permission_classes([IsAuthenticated])
def add_trade_details(request, tradereq_id):
    """
    Add or get trade details for a specific trade request.
    Both requester and responder must submit their details.
    Calculates XP based on user choices.
    
    POST: Create/update trade details for the authenticated user
    GET: Get all trade details for this trade request
    """
    
    def calculate_xp(skill_prof, mode_del, req_type):
        """
        Calculate total XP based on user choices
        """
        xp_mapping = {
            # Skill Proficiency XP
            TradeDetail.SkillProficiency.BEGINNER: 50,
            TradeDetail.SkillProficiency.INTERMEDIATE: 100,
            TradeDetail.SkillProficiency.ADVANCED: 150,
            TradeDetail.SkillProficiency.CERTIFIED: 200,
            
            # Mode of Delivery XP
            TradeDetail.ModeDelivery.ONSITE: 100,
            TradeDetail.ModeDelivery.ONLINE: 75,
            TradeDetail.ModeDelivery.HYBRID: 150,
            
            # Request Type XP
            TradeDetail.RequestType.OUTPUT: 100,
            TradeDetail.RequestType.SERVICE: 150,
            TradeDetail.RequestType.PROJECT: 300,
        }
        
        skill_xp = xp_mapping.get(skill_prof, 0)
        delivery_xp = xp_mapping.get(mode_del, 0)
        request_xp = xp_mapping.get(req_type, 0)
        
        total_xp = skill_xp + delivery_xp + request_xp
        
        print(f"XP Calculation:")
        print(f"  Skill ({skill_prof}): {skill_xp} XP")
        print(f"  Delivery ({mode_del}): {delivery_xp} XP")
        print(f"  Request ({req_type}): {request_xp} XP")
        print(f"  Total: {total_xp} XP")
        
        return total_xp
    
    try:
        # Get the trade request
        trade_request = TradeRequest.objects.select_related('requester', 'responder').get(
            tradereq_id=tradereq_id
        )
        
        # Verify user is part of this trade (either requester or responder)
        if request.user not in [trade_request.requester, trade_request.responder]:
            return Response({
                "error": "You are not authorized to add details to this trade"
            }, status=403)
        
        if request.method == 'GET':
            # Return all trade details for this trade request
            trade_details = TradeDetail.objects.filter(
                trade_request=trade_request
            ).select_related('user')
            
            details_data = []
            for detail in trade_details:
                # contextpic is already a URL from Cloudinary, no need to build_absolute_uri
                context_pic_url = detail.contextpic if detail.contextpic else None
                
                details_data.append({
                    "user_id": detail.user.id,
                    "user_name": f"{detail.user.first_name} {detail.user.last_name}".strip() or detail.user.username,
                    "skillprof": detail.skillprof,
                    "modedel": detail.modedel,
                    "reqtype": detail.reqtype,
                    "reqbio": detail.reqbio,
                    "contextpic": context_pic_url,
                    "total_xp": detail.total_xp,
                    "created_at": detail.created_at,
                })
            
            return Response({
                "trade_request": {
                    "tradereq_id": trade_request.tradereq_id,
                    "reqname": trade_request.reqname,
                    "deadline": trade_request.reqdeadline,
                    "status": trade_request.status,
                    "exchange": trade_request.exchange,
                    "requester": {
                        "id": trade_request.requester.id,
                        "name": f"{trade_request.requester.first_name} {trade_request.requester.last_name}".strip() or trade_request.requester.username
                    },
                    "responder": {
                        "id": trade_request.responder.id,
                        "name": f"{trade_request.responder.first_name} {trade_request.responder.last_name}".strip() or trade_request.responder.username
                    } if trade_request.responder else None
                },
                "details": details_data,
                "user_has_submitted": any(d["user_id"] == request.user.id for d in details_data),
                "both_submitted": len(details_data) >= 2
            }, status=200)
        
        elif request.method == 'POST':
            print("=== ADD TRADE DETAILS DEBUG ===")
            print(f"Trade request ID: {tradereq_id}")
            print(f"User: {request.user.id}")
            print(f"Request data: {request.data}")
            print(f"Files: {list(request.FILES.keys())}")
            
            # Validate required fields
            delivery_mode = request.data.get('deliveryMode')
            skill_level = request.data.get('skillLevel') 
            request_type = request.data.get('requestType')
            details = request.data.get('details', '').strip()
            
            if not all([delivery_mode, skill_level, request_type, details]):
                return Response({
                    "error": "All fields (delivery mode, skill level, request type, and details) are required"
                }, status=400)
            
            # Map frontend field names to backend choices
            delivery_mode_mapping = {
                'onsite': TradeDetail.ModeDelivery.ONSITE,
                'online': TradeDetail.ModeDelivery.ONLINE,
                'hybrid': TradeDetail.ModeDelivery.HYBRID
            }
            
            skill_level_mapping = {
                'beginner': TradeDetail.SkillProficiency.BEGINNER,
                'intermediate': TradeDetail.SkillProficiency.INTERMEDIATE,
                'advanced': TradeDetail.SkillProficiency.ADVANCED,
                'certified': TradeDetail.SkillProficiency.CERTIFIED
            }
            
            request_type_mapping = {
                'service': TradeDetail.RequestType.SERVICE,
                'output': TradeDetail.RequestType.OUTPUT,
                'project': TradeDetail.RequestType.PROJECT
            }
            
            # Validate and map values
            mapped_delivery = delivery_mode_mapping.get(delivery_mode.lower())
            mapped_skill = skill_level_mapping.get(skill_level.lower())
            mapped_request_type = request_type_mapping.get(request_type.lower())
            
            if not mapped_delivery:
                return Response({"error": f"Invalid delivery mode: {delivery_mode}"}, status=400)
            if not mapped_skill:
                return Response({"error": f"Invalid skill level: {skill_level}"}, status=400)
            if not mapped_request_type:
                return Response({"error": f"Invalid request type: {request_type}"}, status=400)
            
            # Calculate total XP based on choices
            total_xp = calculate_xp(mapped_skill, mapped_delivery, mapped_request_type)
            
            # Handle photo upload with Cloudinary
            context_pic_file = request.FILES.get('photo')
            context_pic_url = None
            
            if context_pic_file:
                try:
                    # Generate unique public_id for this trade detail
                    public_id = f"trade_{tradereq_id}_user_{request.user.id}_context"
                    
                    upload_result = cloudinary.uploader.upload(
                        context_pic_file,
                        folder="media/requestcontext_pics",
                        public_id=public_id,
                        resource_type="image",
                        overwrite=True,  # Allows resubmission/updating
                        invalidate=True
                    )
                    context_pic_url = upload_result['secure_url']
                    print(f"[DEBUG] Uploaded context pic to Cloudinary: {context_pic_url}")
                except Exception as e:
                    print(f"[ERROR] Cloudinary upload failed: {e}")
                    import traceback
                    traceback.print_exc()
                    return Response({"error": f"Failed to upload image: {str(e)}"}, status=500)
            
            # Create or update trade detail
            trade_detail, created = TradeDetail.objects.get_or_create(
                trade_request=trade_request,
                user=request.user,
                defaults={
                    'skillprof': mapped_skill,
                    'modedel': mapped_delivery,
                    'reqtype': mapped_request_type,
                    'reqbio': details[:150],  # Limit to database field length
                    'contextpic': context_pic_url,  # Store Cloudinary URL
                    'total_xp': total_xp,
                }
            )
            
            if not created:
                # Update existing record
                trade_detail.skillprof = mapped_skill
                trade_detail.modedel = mapped_delivery
                trade_detail.reqtype = mapped_request_type
                trade_detail.reqbio = details[:150]
                trade_detail.total_xp = total_xp
                
                # Only update contextpic if new file was uploaded
                context_pic_url = detail.contextpic if detail.contextpic else None

                
                trade_detail.save()
            
            # Check if both users have submitted details
            total_details = TradeDetail.objects.filter(trade_request=trade_request).count()
            both_submitted = total_details >= 2
            
            print(f"Trade detail {'created' if created else 'updated'} successfully")
            print(f"Both users submitted details: {both_submitted}")
            print(f"XP awarded: {total_xp}")
            
            return Response({
                "message": f"Trade details {'added' if created else 'updated'} successfully",
                "trade_detail": {
                    "user_id": request.user.id,
                    "skillprof": trade_detail.skillprof,
                    "modedel": trade_detail.modedel,
                    "reqtype": trade_detail.reqtype,
                    "reqbio": trade_detail.reqbio,
                    "contextpic": trade_detail.contextpic,  # Already a Cloudinary URL
                    "total_xp": trade_detail.total_xp,
                    "created_at": trade_detail.created_at,
                },
                "both_submitted": both_submitted,
                "created": created,
                "xp_breakdown": {
                    "skill_proficiency": {
                        "choice": mapped_skill,
                        "xp": 50 if mapped_skill == TradeDetail.SkillProficiency.BEGINNER else
                             100 if mapped_skill == TradeDetail.SkillProficiency.INTERMEDIATE else
                             150 if mapped_skill == TradeDetail.SkillProficiency.ADVANCED else 200
                    },
                    "delivery_mode": {
                        "choice": mapped_delivery,
                        "xp": 100 if mapped_delivery == TradeDetail.ModeDelivery.ONSITE else
                             75 if mapped_delivery == TradeDetail.ModeDelivery.ONLINE else 150
                    },
                    "request_type": {
                        "choice": mapped_request_type,
                        "xp": 100 if mapped_request_type == TradeDetail.RequestType.OUTPUT else
                             150 if mapped_request_type == TradeDetail.RequestType.SERVICE else 300
                    },
                    "total_xp": total_xp
                }
            }, status=201 if created else 200)
            
    except TradeRequest.DoesNotExist:
        return Response({
            "error": "Trade request not found"
        }, status=404)
        
    except Exception as e:
        print(f"Add trade details error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            "error": f"Failed to add trade details: {str(e)}"
        }, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_trade_details_status(request, tradereq_id):
    """
    Check the status of trade details submission for both requester and responder
    """
    try:
        trade_request = TradeRequest.objects.select_related('requester', 'responder').get(
            tradereq_id=tradereq_id
        )
        
        # Verify user is part of this trade
        if request.user not in [trade_request.requester, trade_request.responder]:
            return Response({
                "error": "You are not authorized to view this trade's details"
            }, status=403)
        
        # Check if both users have submitted details
        trade_details = TradeDetail.objects.filter(trade_request=trade_request)
        
        requester_detail = trade_details.filter(user=trade_request.requester).first()
        responder_detail = None
        if trade_request.responder:
            responder_detail = trade_details.filter(user=trade_request.responder).first()
        
        requester_submitted = requester_detail is not None
        responder_submitted = responder_detail is not None
        both_submitted = requester_submitted and responder_submitted
        
        current_user_submitted = any(
            detail.user == request.user for detail in trade_details
        )
        
        return Response({
            "trade_request": {
                "tradereq_id": trade_request.tradereq_id,
                "reqname": trade_request.reqname,
                "status": trade_request.status,
                "exchange": trade_request.exchange,
            },
            "requester": {
                "id": trade_request.requester.id,
                "name": f"{trade_request.requester.first_name} {trade_request.requester.last_name}".strip() or trade_request.requester.username,
                "has_submitted": requester_submitted
            },
            "responder": {
                "id": trade_request.responder.id if trade_request.responder else None,
                "name": f"{trade_request.responder.first_name} {trade_request.responder.last_name}".strip() or trade_request.responder.username if trade_request.responder else None,
                "has_submitted": responder_submitted
            } if trade_request.responder else None,
            "current_user": {
                "id": request.user.id,
                "is_requester": request.user == trade_request.requester,
                "is_responder": request.user == trade_request.responder,
                "has_submitted": current_user_submitted
            },
            "submission_status": {
                "both_submitted": both_submitted,
                "requester_submitted": requester_submitted,
                "responder_submitted": responder_submitted,
                "ready_to_proceed": both_submitted
            }
        }, status=200)
        
    except TradeRequest.DoesNotExist:
        return Response({
            "error": "Trade request not found"
        }, status=404)

# In your views.py

@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_trade_proof(request):
    """
    Handles proof submissions (both uploaded files and entered links).
    Saves them in TradeHistory.requester_proof or responder_proof as JSON objects.
    ✅ UPDATED: Now handles multiple files and links, and appends to existing proof.
    """
    print("=== UPLOAD TRADE PROOF DEBUG ===")
    print(f"User: {request.user.id}")
    print(f"Request data keys: {list(request.data.keys())}")
    print(f"Request FILES keys: {list(request.FILES.keys())}")
    
    user = request.user
    trade_request_id = request.data.get("trade_request_id")

    if not trade_request_id:
        return Response({"error": "Missing trade_request_id"}, status=400)

    try:
        trade_request = TradeRequest.objects.get(tradereq_id=trade_request_id)
    except TradeRequest.DoesNotExist:
        return Response({"error": "Trade request not found"}, status=404)

    # Determine if user is requester or responder
    is_requester = trade_request.requester_id == user.id
    is_responder = trade_request.responder_id == user.id

    if not (is_requester or is_responder):
        return Response({"error": "You are not part of this trade"}, status=403)

    trade_history, _ = TradeHistory.objects.get_or_create(trade_request=trade_request)

    proof_items = []

    # ✅ Handle multiple uploaded files
    uploaded_files = request.FILES.getlist("proof_files")
    print(f"Processing {len(uploaded_files)} files")
    
    for f in uploaded_files:
        try:
            resource_type = "image" if f.content_type.startswith("image/") else "raw"
            
            upload_result = cloudinary.uploader.upload(
                f,
                folder="media/trade_proofs",
                resource_type=resource_type,
                use_filename=True,
                unique_filename=True
            )
            
            proof_items.append({
                "type": "file",
                "url": upload_result["secure_url"],
                "filename": f.name,
                "file_type": f.content_type,
                "uploaded_at": django_timezone.now().isoformat()
            })
            print(f"✅ Uploaded file: {f.name} -> {upload_result['secure_url']}")
        except Exception as e:
            print(f"❌ Error uploading file {f.name}: {e}")
            return Response({"error": f"Failed to upload file {f.name}: {str(e)}"}, status=500)

    # ✅ Handle multiple external links (sent as 'proof_links[]')
    links = request.data.getlist("proof_links[]")
    links = list(dict.fromkeys([link.strip() for link in links if link and link.strip()]))
    
    print(f"Processing {len(links)} unique links: {links}")
    
    for link in links:
        proof_items.append({
            "type": "link",
            "url": link,
            "filename": link,  # Use URL for consistency
            "added_at": django_timezone.now().isoformat()
        })
        print(f"✅ Added link: {link}")

    if not proof_items:
        return Response({"error": "No new proof files or links were provided."}, status=400)

    # ✅ Append new proof items to the existing list, don't overwrite
    try:
        with transaction.atomic():
            partner_user = None
            
            if is_requester:
                existing_proof = trade_history.requester_proof or []
                trade_history.requester_proof = existing_proof + proof_items
                trade_history.requester_proof_status = TradeHistory.ProofStatus.PENDING
            elif is_responder:
                existing_proof = trade_history.responder_proof or []
                trade_history.responder_proof = existing_proof + proof_items
                trade_history.responder_proof_status = TradeHistory.ProofStatus.PENDING

            trade_history.save()
            
            # Notification to partner about proof submission
            if partner_user:
                try:
                    Notification.objects.create(
                        recipient=partner_user, # Notify the partner
                        sender=request.user,
                        message=f"{request.user.first_name or request.user.username} finished their output for \"{trade_request.reqname}\". Check out and evaluate their proof!",
                        notification_type=Notification.NotificationType.PROOF_SUBMITTED,
                        link=f"/home/trades/active/"
                    )
                except Exception as e:
                    print(f"Failed to create PROOF_SUBMITTED notification: {e}")
                    
        return Response({
            "message": "Proof uploaded successfully.",
            "files_uploaded": len(uploaded_files),
            "links_added": len(links)
        }, status=200)
    except Exception as e:
        print(f"❌ Database error: {e}")
        return Response({"error": f"Failed to save proof: {str(e)}"}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_trade_proof_status(request, tradereq_id):
    """
    Get comprehensive proof submission and approval status for a trade
    """
    try:
        trade_request = TradeRequest.objects.select_related('requester', 'responder').get(
            Q(tradereq_id=tradereq_id) &
            Q(status__in=[TradeRequest.Status.ACTIVE, TradeRequest.Status.COMPLETED])
        )
        
        if request.user not in [trade_request.requester, trade_request.responder]:
            return Response({"error": "You are not authorized to view this trade's proof status"}, status=403)
        
        # Get trade history
        trade_history = TradeHistory.objects.filter(trade_request=trade_request).first()
        
        if not trade_history:
            # No proof submissions yet
            return Response({
                "trade_request_id": trade_request.tradereq_id,
                "current_user_submitted": False,
                "partner_submitted": False,
                "both_submitted": False,
                "current_user_approved": False,
                "partner_approved": False,
                "both_approved": False,
                "current_user_is_requester": request.user == trade_request.requester,
                "status": "waiting_for_proofs"
            }, status=200)
        
        # Check submission and approval status
        current_user_is_requester = (request.user == trade_request.requester)
        
        if current_user_is_requester:
            # Current user is requester
            current_user_submitted = bool(trade_history.requester_proof)
            partner_submitted = bool(trade_history.responder_proof)
            current_user_approved = trade_history.requester_proof_status == TradeHistory.ProofStatus.APPROVED
            partner_approved = trade_history.responder_proof_status == TradeHistory.ProofStatus.APPROVED
        else:
            # Current user is responder
            current_user_submitted = bool(trade_history.responder_proof)
            partner_submitted = bool(trade_history.requester_proof)
            current_user_approved = trade_history.responder_proof_status == TradeHistory.ProofStatus.APPROVED
            partner_approved = trade_history.requester_proof_status == TradeHistory.ProofStatus.APPROVED
        
        both_submitted = current_user_submitted and partner_submitted
        both_approved = current_user_approved and partner_approved
        
        # Determine overall status
        if both_approved:
            status = "ready_to_rate"
        elif both_submitted:
            status = "waiting_for_approval"
        elif current_user_submitted and not partner_submitted:
            status = "waiting_for_partner_proof"
        elif not current_user_submitted and partner_submitted:
            status = "waiting_for_your_proof"
        else:
            status = "waiting_for_proofs"
        
        return Response({
            "trade_request_id": trade_request.tradereq_id,
            "current_user_submitted": current_user_submitted,
            "partner_submitted": partner_submitted,
            "both_submitted": both_submitted,
            "current_user_approved": current_user_approved,
            "partner_approved": partner_approved,
            "both_approved": both_approved,
            "current_user_is_requester": current_user_is_requester,
            "status": status,
            "requester_proof_status": trade_history.requester_proof_status,
            "responder_proof_status": trade_history.responder_proof_status
        }, status=200)
        
    except TradeRequest.DoesNotExist:
        return Response({"error": "Active trade request not found"}, status=404)
    except Exception as e:
        print(f"Get proof status error: {str(e)}")
        return Response({"error": f"Failed to get proof status: {str(e)}"}, status=500)
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_partner_proof(request, tradereq_id):
    """
    Get partner's proof files for viewing/approval
    Returns array of all proof items (files and links)
    """
    try:
        trade_request = TradeRequest.objects.select_related('requester', 'responder').get(
            tradereq_id=tradereq_id
        )
        
        if request.user not in [trade_request.requester, trade_request.responder]:
            return Response({"error": "You are not authorized to view this trade's proof"}, status=403)
        
        trade_history = TradeHistory.objects.filter(trade_request=trade_request).first()
        if not trade_history:
            return Response({"error": "No proof submissions found"}, status=404)
        
        # Determine partner's proof
        current_user_is_requester = (request.user == trade_request.requester)
        
        if current_user_is_requester:
            # Current user is requester, get responder's proof
            partner_proof_list = trade_history.responder_proof or []
            partner_proof_status = trade_history.responder_proof_status
            partner_name = f"{trade_request.responder.first_name} {trade_request.responder.last_name}".strip() or trade_request.responder.username
        else:
            # Current user is responder, get requester's proof
            partner_proof_list = trade_history.requester_proof or []
            partner_proof_status = trade_history.requester_proof_status
            partner_name = f"{trade_request.requester.first_name} {trade_request.requester.last_name}".strip() or trade_request.requester.username
        
        if not partner_proof_list:
            return Response({"error": "Partner has not submitted proof yet"}, status=404)
        
        # ✅ Return the full array of proof items (files and links)
        return Response({
            "trade_request_id": trade_request.tradereq_id,
            "partner_name": partner_name,
            "proof_file": partner_proof_list,  # This key now contains an array
            "proof_status": partner_proof_status
        }, status=200)
        
    except TradeRequest.DoesNotExist:
        return Response({"error": "Active trade request not found"}, status=404)
    except Exception as e:
        print(f"Get partner proof error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"error": f"Failed to get partner proof: {str(e)}"}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_my_proof(request, tradereq_id):
    """
    Get current user's own proof submission for a trade
    Returns array of all proof items (files and links)
    """
    try:
        trade_request = TradeRequest.objects.select_related('requester', 'responder').get(
            tradereq_id=tradereq_id,
            status=TradeRequest.Status.ACTIVE
        )
        
        if request.user not in [trade_request.requester, trade_request.responder]:
            return Response({"error": "You are not authorized to view proof for this trade"}, status=403)
        
        trade_history = TradeHistory.objects.filter(trade_request=trade_request).first()
        if not trade_history:
            return Response({"error": "No proof submissions found for this trade"}, status=404)
        
        # Determine which proof belongs to current user
        current_user_is_requester = (request.user == trade_request.requester)
        
        if current_user_is_requester:
            user_proof_list = trade_history.requester_proof or []
            user_proof_status = trade_history.requester_proof_status
        else:
            user_proof_list = trade_history.responder_proof or []
            user_proof_status = trade_history.responder_proof_status
        
        if not user_proof_list:
            return Response({
                "message": "You have not submitted proof yet",
                "has_proof": False
            }, status=200)

        # ✅ Return the full array of proof items (files and links)
        return Response({
            "trade_request_id": trade_request.tradereq_id,
            "has_proof": bool(user_proof_list),
            "proof_file": user_proof_list,  # This key now contains an array
            "proof_status": user_proof_status
        }, status=200)
        
    except TradeRequest.DoesNotExist:
        return Response({"error": "Active trade request not found"}, status=404)
    except Exception as e:
        print(f"Get my proof error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"error": f"Failed to get proof: {str(e)}"}, status=500)  

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def approve_partner_proof(request, tradereq_id):
    """
    Approve partner's proof submission
    """
    try:
        trade_request = TradeRequest.objects.select_related('requester', 'responder').get(
            tradereq_id=tradereq_id,
            status=TradeRequest.Status.ACTIVE
        )
        
        if request.user not in [trade_request.requester, trade_request.responder]:
            return Response({"error": "You are not authorized to approve proof for this trade"}, status=403)
        
        trade_history = TradeHistory.objects.filter(trade_request=trade_request).first()
        if not trade_history:
            return Response({"error": "No proof submissions found"}, status=404)
        
        # Determine which proof to approve
        current_user_is_requester = (request.user == trade_request.requester)
        partner_user = None
        
        with transaction.atomic():
            if current_user_is_requester:
                # Requester approving responder's proof
                if not trade_history.responder_proof:
                    return Response({"error": "Responder has not submitted proof yet"}, status=400)
                trade_history.responder_proof_status = TradeHistory.ProofStatus.APPROVED
            else:
                # Responder approving requester's proof
                if not trade_history.requester_proof:
                    return Response({"error": "Requester has not submitted proof yet"}, status=400)
                trade_history.requester_proof_status = TradeHistory.ProofStatus.APPROVED
            
            trade_history.save()
            
            # Check if both proofs are approved
            both_approved = (
                trade_history.requester_proof_status == TradeHistory.ProofStatus.APPROVED and
                trade_history.responder_proof_status == TradeHistory.ProofStatus.APPROVED
            )
            
            # Notification to partner about proof approval
            if partner_user:
                try:
                    Notification.objects.create(
                        recipient=partner_user, # Notify the partner
                        sender=request.user,
                        message=f"{request.user.first_name or request.user.username} approved your output proof. Don’t forget to rate them!",
                        notification_type=Notification.NotificationType.PROOF_APPROVED,
                        link=f"/home/trades/active/"
                    )
                except Exception as e:
                    print(f"Failed to create PROOF_APPROVED notification: {e}")
        
        return Response({
            "message": "Proof approved successfully",
            "trade_request_id": trade_request.tradereq_id,
            "both_approved": both_approved,
            "trade_completed": both_approved,
            "current_user_approved_partner": True,
            "workflow_status": "ready_to_rate" if both_approved else "waiting_for_approval"
        }, status=200)
        
    except TradeRequest.DoesNotExist:
        return Response({"error": "Active trade request not found"}, status=404)
    except Exception as e:
        print(f"Approve proof error: {str(e)}")
        return Response({"error": f"Failed to approve proof: {str(e)}"}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reject_partner_proof(request, tradereq_id):
    """
    Reject partner's proof submission.
    ✅ UPDATED: Sets partner's proof status to REJECTED, clears their proof array,
    and deletes their submitted files from Cloudinary.
    """
    try:
        trade_request = TradeRequest.objects.select_related('requester', 'responder').get(
            tradereq_id=tradereq_id,
            status__in=[TradeRequest.Status.ACTIVE, TradeRequest.Status.COMPLETED] # Allow rejection in completed state too
        )
        
        if request.user not in [trade_request.requester, trade_request.responder]:
            return Response({"error": "You are not authorized to reject proof for this trade"}, status=403)
        
        trade_history = TradeHistory.objects.filter(trade_request=trade_request).first()
        if not trade_history:
            return Response({"error": "No proof submissions found"}, status=404)
        
        current_user_is_requester = (request.user == trade_request.requester)
        
        with transaction.atomic():
            proof_to_clear = []
            if current_user_is_requester:
                # Requester rejecting responder's proof
                if not trade_history.responder_proof:
                     return Response({"error": "Partner has not submitted proof to reject."}, status=400)
                proof_to_clear = trade_history.responder_proof
                trade_history.responder_proof = [] # Clear the proof array
                trade_history.responder_proof_status = TradeHistory.ProofStatus.REJECTED # ✅ Set status to REJECTED
            else:
                # Responder rejecting requester's proof
                if not trade_history.requester_proof:
                    return Response({"error": "Partner has not submitted proof to reject."}, status=400)
                proof_to_clear = trade_history.requester_proof
                trade_history.requester_proof = [] # Clear the proof array
                trade_history.requester_proof_status = TradeHistory.ProofStatus.REJECTED # ✅ Set status to REJECTED
            
            trade_history.save()

            # ✅ Delete rejected files from Cloudinary
            public_ids_to_delete = []
            for item in proof_to_clear:
                if item.get("type") == "file":
                    # Extract public_id from URL (e.g., .../media/trade_proofs/file.jpg)
                    try:
                        parts = item["url"].split('/')
                        folder_index = parts.index("media")
                        public_id_with_ext = "/".join(parts[folder_index:])
                        public_id = os.path.splitext(public_id_with_ext)[0]
                        public_ids_to_delete.append(public_id)
                    except (ValueError, KeyError, IndexError):
                        print(f"Could not parse public_id from URL: {item.get('url')}")
            
            if public_ids_to_delete:
                try:
                    cloudinary.api.delete_resources(public_ids_to_delete, resource_type="raw")
                    cloudinary.api.delete_resources(public_ids_to_delete, resource_type="image")
                    print(f"Deleted {len(public_ids_to_delete)} rejected files from Cloudinary: {public_ids_to_delete}")
                except Exception as e:
                    print(f"Warning: Cloudinary deletion failed for some resources: {e}")

        return Response({
            "message": "Proof rejected successfully. Partner has been notified to resubmit.",
            "trade_request_id": trade_request.tradereq_id,
        }, status=200)
        
    except TradeRequest.DoesNotExist:
        return Response({"error": "Active trade request not found"}, status=404)
    except Exception as e:
        print(f"Reject proof error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"error": f"Failed to reject proof: {str(e)}"}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_trade_rating(request):
    """
    Submit rating and review for a completed trade.
    Awards XP IMMEDIATELY upon rating (from PARTNER's trade detail complexity).
    Updates PARTNER's rating stats with the stars YOU give them.
    Trade disappears from that user's Active Trades list immediately.
    Trade becomes COMPLETED only after both users rate.
    """
    print("=== SUBMIT TRADE RATING DEBUG ===")
    print(f"Request data: {request.data}")
    print(f"User: {request.user.id}")
    
    trade_request_id = request.data.get('trade_request_id')
    rating = request.data.get('rating', 4)  # Default to 4 stars
    review_description = request.data.get('review_description', '').strip()
    
    # Validate input
    if not trade_request_id:
        return Response({"error": "trade_request_id is required"}, status=400)
    
    if not review_description:
        return Response({"error": "Please provide feedback about your trade experience"}, status=400)
    
    if len(review_description) > 500:
        return Response({"error": "Review description must be 500 characters or less"}, status=400)
    
    try:
        # Get the trade request
        trade_request = TradeRequest.objects.select_related('requester', 'responder').get(
            tradereq_id=trade_request_id
        )
        
        # Verify user is part of this trade
        if request.user not in [trade_request.requester, trade_request.responder]:
            return Response({"error": "You are not authorized to rate this trade"}, status=403)
        
        # Verify trade is in correct status (should be ACTIVE with both proofs approved)
        if trade_request.status not in [TradeRequest.Status.ACTIVE, TradeRequest.Status.COMPLETED]:
            return Response({"error": "Trade must be active or completed to submit rating"}, status=400)
        
        # Check if both proofs are approved
        trade_history = TradeHistory.objects.filter(trade_request=trade_request).first()
        if not trade_history:
            return Response({"error": "Trade history not found"}, status=404)
        
        if (trade_history.requester_proof_status != TradeHistory.ProofStatus.APPROVED or
            trade_history.responder_proof_status != TradeHistory.ProofStatus.APPROVED):
            return Response({"error": "Both proofs must be approved before rating can be submitted"}, status=400)
        
        # Determine if current user is requester or responder
        current_user_is_requester = (request.user == trade_request.requester)
        partner_user = trade_request.responder if current_user_is_requester else trade_request.requester
        
        with transaction.atomic():
            # Check if user has already rated (using boolean flags)
            if current_user_is_requester:
                if trade_request.requester_rated:
                    return Response({"error": "You have already submitted a rating for this trade."}, status=400)
                # Mark requester as having rated
                trade_request.requester_rated = True
            else:
                if trade_request.responder_rated:
                    return Response({"error": "You have already submitted a rating for this trade."}, status=400)
                # Mark responder as having rated
                trade_request.responder_rated = True
            
            # Get or create reputation system record
            reputation_record, created = ReputationSystem.objects.get_or_create(
                trade_request=trade_request
            )
            
            # Save rating and description with timestamp
            # The rating YOU give goes to YOUR PARTNER
            # Your review description is stored under YOUR field (describing your experience)
            current_time = django_timezone.now()
            if current_user_is_requester:
                # Requester's rating goes to responder
                reputation_record.requester_starcount = rating  # This will update responder's avgStars
                reputation_record.requester_rating_desc = review_description  # Requester's review about responder
                reputation_record.requester_rated_at = current_time
            else:
                # Responder's rating goes to requester
                reputation_record.responder_starcount = rating  # This will update requester's avgStars
                reputation_record.responder_rating_desc = review_description  # Responder's review about requester
                reputation_record.responder_rated_at = current_time
            
            reputation_record.save()
            
            # ✅ CORRECTED XP AWARD - Award XP from PARTNER's trade detail
            # Partner's complexity (what they're offering you) = Your XP reward
            partner_trade_detail = TradeDetail.objects.filter(
                trade_request=trade_request, 
                user=partner_user
            ).first()
            
            xp_awarded = 0
            if partner_trade_detail:
                xp_awarded = partner_trade_detail.total_xp or 0
                request.user.tot_XpPts += xp_awarded
                request.user.level = max(1, (request.user.tot_XpPts // 1000) + 1)
                request.user.save()
                print(f"Awarded {xp_awarded} XP to user {request.user.id} from partner's trade detail (partner: {partner_user.id})")
            
            # ✅ UPDATE PARTNER'S RATING - The stars YOU gave update PARTNER's profile
            partner_new_rating_count = partner_user.ratingCount + 1
            partner_total_stars = (float(partner_user.avgStars or 0) * partner_user.ratingCount) + rating
            partner_new_avg = partner_total_stars / partner_new_rating_count
            
            partner_user.ratingCount = partner_new_rating_count
            partner_user.avgStars = round(partner_new_avg, 2)
            partner_user.save()
            
            print(f"Updated partner {partner_user.id} rating: {partner_user.avgStars} stars ({partner_user.ratingCount} reviews)")
            print(f"Rating {rating} stars from {request.user.id} added to partner {partner_user.id}")
            
            # Check if both users have now rated
            both_rated = trade_request.requester_rated and trade_request.responder_rated
            
            if both_rated:
                # ✅ MARK TRADE AS COMPLETED - Only when both users have rated
                trade_request.status = TradeRequest.Status.COMPLETED
                
                # Set completion timestamp in trade history
                if not trade_history.completed_at:
                    trade_history.completed_at = django_timezone.now()
                    trade_history.save()
                
                print(f"Trade {trade_request_id} marked as COMPLETED - both users have rated")
            
            # Save the updated trade request with rating flags
            trade_request.save()
        
        return Response({
            "message": "Rating submitted successfully! You have been awarded XP.",
            "trade_request_id": trade_request.tradereq_id,
            "user_rating_submitted": rating,
            "both_users_rated": both_rated,
            "trade_completed": both_rated,
            "trade_status": "COMPLETED" if both_rated else "ACTIVE",
            "xp_awarded": xp_awarded,  # XP awarded immediately from partner's complexity
            "new_total_xp": request.user.tot_XpPts,
            "new_level": request.user.level,
            "trade_disappears_for_user": True,  # Trade will disappear from this user's active trades
            "partner_still_needs_to_rate": not both_rated,
            "partner_rating_updated": {
                "partner_id": partner_user.id,
                "new_avg_stars": float(partner_user.avgStars),
                "new_rating_count": partner_user.ratingCount
            }
        }, status=200)
        
    except TradeRequest.DoesNotExist:
        return Response({"error": "Trade request not found"}, status=404)
    except Exception as e:
        print(f"Submit rating error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"error": f"Failed to submit rating: {str(e)}"}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_trade_rating_status(request, tradereq_id):
    """
    Get rating status for a trade - whether current user has rated and if partner has rated
    """
    try:
        trade_request = TradeRequest.objects.select_related('requester', 'responder').get(
            tradereq_id=tradereq_id
        )
        
        if request.user not in [trade_request.requester, trade_request.responder]:
            return Response({"error": "You are not authorized to view this trade's rating status"}, status=403)
        
        # Get reputation record
        reputation_record = ReputationSystem.objects.filter(trade_request=trade_request).first()
        
        if not reputation_record:
            return Response({
                "trade_request_id": trade_request.tradereq_id,
                "current_user_rated": False,
                "partner_rated": False,
                "both_rated": False,
                "trade_completed": False,
                "can_rate": True
            }, status=200)
        
        # Determine rating status
        current_user_is_requester = (request.user == trade_request.requester)
        
        current_user_rated = (reputation_record.requester_starcount is not None if current_user_is_requester 
                            else reputation_record.responder_starcount is not None)
        partner_rated = (reputation_record.responder_starcount is not None if current_user_is_requester 
                       else reputation_record.requester_starcount is not None)
        
        both_rated = current_user_rated and partner_rated
        
        return Response({
            "trade_request_id": trade_request.tradereq_id,
            "current_user_rated": current_user_rated,
            "partner_rated": partner_rated,
            "both_rated": both_rated,
            "trade_completed": trade_request.status == TradeRequest.Status.COMPLETED,
            "can_rate": not current_user_rated,
            "trade_details": {
                "reqname": trade_request.reqname,
                "exchange": trade_request.exchange,
                "partner_name": (f"{trade_request.responder.first_name} {trade_request.responder.last_name}".strip() or trade_request.responder.username 
                               if current_user_is_requester else 
                               f"{trade_request.requester.first_name} {trade_request.requester.last_name}".strip() or trade_request.requester.username)
            }
        }, status=200)
        
    except TradeRequest.DoesNotExist:
        return Response({"error": "Trade request not found"}, status=404)
    except Exception as e:
        print(f"Get rating status error: {str(e)}")
        return Response({"error": f"Failed to get rating status: {str(e)}"}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def     ted_trades(request):
    """
    Get all COMPLETED trades where the user was a participant (requester or responder).
    This is specifically for the completed trades history page.
    ✅ CORRECTED: Now swaps 'reqname' and 'exchange' based on user's perspective.
    """
    user = request.user
    print(f"=== GET_COMPLETED_TRADES (Corrected) DEBUG ===")
    print(f"User ID: {user.id}")

    try:
        completed_trades_query = TradeRequest.objects.filter(
            status=TradeRequest.Status.COMPLETED,
            requester__isnull=False,
            responder__isnull=False
        ).filter(
            Q(requester=user) | Q(responder=user)
        ).select_related('requester', 'responder').order_by('-tradereq_id')

        print(f"Found {completed_trades_query.count()} completed trades for user {user.id}")

        trades_data = []
        for trade in completed_trades_query:
            is_requester = (trade.requester.id == user.id)
            other_user = trade.responder if is_requester else trade.requester

            if not other_user:
                print(f"Skipping trade {trade.tradereq_id} due to missing other_user")
                continue

            if is_requester:
                user_perspective_needed = trade.reqname
                user_perspective_offered = trade.exchange
            else:
                user_perspective_needed = trade.exchange
                user_perspective_offered = trade.reqname

            profile_pic_url = other_user.profilePic if other_user.profilePic else None

            user_trade_detail = TradeDetail.objects.filter(trade_request=trade, user=user).first()
            total_xp = user_trade_detail.total_xp if user_trade_detail else 0

            trade_history = TradeHistory.objects.filter(trade_request=trade).first()
            completed_at = trade_history.completed_at if trade_history and trade_history.completed_at else None
            
            deadline_formatted = completed_at.strftime('%B %d, %Y') if completed_at else "Date not available"

            trades_data.append({
                "tradereq_id": trade.tradereq_id,
                "other_user": {
                    "id": other_user.id,
                    "name": f"{other_user.first_name} {other_user.last_name}".strip() or other_user.username,
                    "username": other_user.username,
                    "profilePic": profile_pic_url,
                    "level": other_user.level,
                    "rating": float(other_user.avgStars or 0)
                },
                # ✅ Gagamitin na natin ang mga bago at tamang variables
                "reqname": user_perspective_needed,
                "exchange": user_perspective_offered,
                "total_xp": total_xp,
                "deadline": completed_at.isoformat() if completed_at else None,
                "deadline_formatted": deadline_formatted,
                "is_requester": is_requester,
                "status": trade.status,
            })

        return Response({
            "completed_trades": trades_data,
            "count": len(trades_data)
        }, status=200)

    except Exception as e:
        print(f"ERROR in get_completed_trades: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            "error": f"Failed to get completed trades: {str(e)}",
            "completed_trades": [],
            "count": 0
        }, status=500)
        
@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def user_verification(request, user_id: int):
    """
    Get or update user verification details
    GET: Returns verification status and details
    PATCH: Update verification document/type (for users) or verification status (for admins)
    """
    user = get_object_or_404(User, pk=user_id)
    
    # Users can only access their own verification
    if request.user.id != user.id:
        return Response({"detail": "You cannot access another user's verification."}, status=403)
    
    try:
        verification = user.verification
    except UserVerification.DoesNotExist:
        # Create verification record if it doesn't exist
        verification = UserVerification.objects.create(user=user)
    
    if request.method == 'GET':
        from .serializers import UserVerificationSerializer
        serializer = UserVerificationSerializer(verification)
        return Response(serializer.data, status=200)
    
    elif request.method == 'PATCH':
        data = request.data.copy()
        
        # Handle ID document upload
        id_document_file = request.FILES.get("id_document")
        if id_document_file:
            try:
                resource_type = "image" if id_document_file.content_type.startswith("image/") else "raw"
                
                upload_result = cloudinary.uploader.upload(
                    id_document_file,
                    folder="media/user_verifications",
                    public_id=f"user_{user.id}_verification",
                    resource_type=resource_type,
                    overwrite=True,
                    invalidate=True
                )
                
                verification.id_document = upload_result['secure_url']
                verification.id_submitted_at = django_timezone.now()
                verification.id_verification_status = VerificationStatus.PENDING
                
                print(f"[SUCCESS] Verification document uploaded: {upload_result['secure_url']}")
            except Exception as e:
                print(f"[ERROR] Upload failed: {e}")
                return Response({"error": f"Upload failed: {str(e)}"}, status=500)
        
        # Update id_type if provided
        if "id_type" in data:
            verification.id_type = data["id_type"]
        
        verification.save()
        
        serializer = UserVerificationSerializer(verification)
        return Response(serializer.data, status=200)
    
    data = request.data.copy()
    data.pop("user_id", None)

    # Ignore profilePic unless it's a real file
    if "profilePic" in data and not request.FILES.get("profilePic"):
        data.pop("profilePic")

    # Ignore id_document unless it's a real file
    if "id_document" in data and not request.FILES.get("id_document"):
        data.pop("id_document")

    # Handle password safely
    if "password" in data:
        user.set_password(data["password"])
        data.pop("password")

    serializer = ProfileUpdateSerializer(instance=user, data=data, partial=True)
    serializer.is_valid(raise_exception=True)
    updated = serializer.save()

    return Response(_public_user_payload(updated, request), status=200)

@api_view(['GET'])
@permission_classes([AllowAny])
def user_reviews(request, user_id: int):
    """
    Get all reviews for a specific user (where they were the trade partner being rated)
    """
    try:
        user = get_object_or_404(User, pk=user_id)
        
        # Get all reputation records where this user received ratings
        # Either as requester (rated by responder) or responder (rated by requester) 
        reputation_records = ReputationSystem.objects.filter(
            Q(trade_request__requester=user, responder_starcount__isnull=False) |
            Q(trade_request__responder=user, requester_starcount__isnull=False)
        ).select_related(
            'trade_request__requester', 
            'trade_request__responder'
        ).order_by('-responder_rated_at', '-requester_rated_at')
        
        reviews = []
        
        for rep in reputation_records:
            trade_request = rep.trade_request
            
            # Determine if the user being viewed is requester or responder
            user_is_requester = (trade_request.requester.id == user.id)
            
            if user_is_requester and rep.responder_starcount is not None:
                # User was requester, rated by responder
                reviewer = trade_request.responder
                rating = rep.responder_starcount
                review_description = rep.responder_rating_desc or ""
                rated_at = rep.responder_rated_at
                
            elif not user_is_requester and rep.requester_starcount is not None:
                # User was responder, rated by requester  
                reviewer = trade_request.requester
                rating = rep.requester_starcount
                review_description = rep.requester_rating_desc or ""
                rated_at = rep.requester_rated_at
            else:
                continue
            
            # Get trade completion date
            trade_history = TradeHistory.objects.filter(trade_request=trade_request).first()
            completed_at = trade_history.completed_at if trade_history else trade_request.created_at
            
            reviews.append({
                "trade_id": trade_request.tradereq_id,
                "reviewer_first_name": reviewer.first_name,
                "reviewer_last_name": reviewer.last_name,
                "reviewer_username": reviewer.username,
                "reviewer_profilepic": reviewer.profilePic if reviewer.profilePic else None,
                "request_title": trade_request.reqname,
                "offer_title": trade_request.exchange or "Service Exchange",
                "rating": rating,
                "review_description": review_description,
                "completed_at": completed_at.isoformat() if completed_at else None,
                "rated_at": rated_at.isoformat() if rated_at else None,
            })
        
        return Response({
            "reviews": reviews,
            "total_count": len(reviews)
        }, status=200)
        
    except Exception as e:
        print(f"Error fetching reviews for user {user_id}: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            "error": f"Failed to fetch reviews: {str(e)}",
            "reviews": [],
            "total_count": 0
        }, status=500) 

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_report(request):
    """
    Create a new user/trade report.
    """
    try:
        data = request.data

        reporter = request.user
        reported_user_id = data.get('reported_user')
        tradereq_id = data.get('tradereq')
        category = data.get('category')
        issue_detail = data.get('issue_detail')
        description = data.get('description', '')

        report = Report.objects.create(
            reporter=reporter,
            reported_user_id=reported_user_id,
            tradereq_id=tradereq_id,
            category=category,
            issue_detail=issue_detail,
            description=description,
            status="Pending",
            created_at=django_timezone.now()
        )
        
        print(Report.objects.last().__dict__)

        serializer = ReportSerializer(report)
        return Response(serializer.data, status=201)

    except Exception as e:
        print(f"Report creation error: {str(e)}")
        return Response({"error": str(e)}, status=400)

def send_support_email(ticket):
    context = {
        "name": ticket.ticket_name,
        "ticket_ref": f"SUP-{ticket.ticket_id:05d}",
        "title": ticket.ticket_title,
        "desc": ticket.ticket_desc,
    }

    subject = f"[Expair Support] Ticket #{ticket.ticket_id}: {ticket.ticket_title}"
    from_email = "expaircs@gmail.com"
    to = [ticket.ticket_email]  # main recipient (user)
    cc = ["expaircs@gmail.com"]  # add your CS inbox here

    text_content = render_to_string("emails/support_confirmation.txt", context)
    html_content = render_to_string("emails/support_confirmation.html", context)

    email = EmailMultiAlternatives(
        subject, text_content, from_email, to, cc=cc
    )
    email.attach_alternative(html_content, "text/html")
    email.send(fail_silently=False)

@api_view(['POST'])
@permission_classes([AllowAny])
def create_support_ticket(request):
    ticket_name = request.data.get("name")
    ticket_email = request.data.get("email")
    ticket_title = request.data.get("subject")
    ticket_desc = request.data.get("message")
    ticket_pic = request.FILES.get("photo").name if request.FILES.get("photo") else None

    ticket = SupportTicket.objects.create(
        ticket_name=ticket_name,
        ticket_email=ticket_email,
        ticket_title=ticket_title,
        ticket_desc=ticket_desc,
        ticket_pic=ticket_pic,
        ticket_datesubmitted=django_timezone.now()
    )

    # send emails (wrap in try/except so ticket creation won't fail on email error)
    try:
        send_support_email(ticket)
    except Exception as e:
        # log, but don't crash
        print("send_support_emails error:", e)

    return Response({"success": True, "ticket_id": ticket.ticket_id}, status=201)

logger = logging.getLogger(__name__)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def api_explore_feed(request):
    """
    Existing explore feed implementation...
    Ensure trades returned are categorized; for trades missing classified_category
    call categorize_tradereq synchronously (limited) and refresh from DB so frontend
    sees a category immediately.
    """
    # ...existing code that builds queryset 'available_trades' ...
    # example retrieval (preserve your original logic):
    from django.apps import apps
    TradeRequest = apps.get_model("accounts", "TradeRequest")
    user = request.user

    available_trades = (
        TradeRequest.objects.filter(status__in=["PENDING", None])
        .exclude(requester=user)
        .select_related("requester")[:200]
    )
    # Auto-categorize uncategorized trades (limit to avoid huge work)
    uncategorized = [t for t in available_trades if not getattr(t, "classified_category", None)]
    for trade in uncategorized[:50]:  # limit to first 50 to bound latency
        try:
            # categorize_tradereq will save the category to DB
            categorize_tradereq(trade.pk)
            # refresh so we include the new category below
            trade.refresh_from_db()
        except Exception as e:
            logger.warning(f"Auto-categorization failed for trade {trade.pk}: {e}")
    
    # Return response with categorized trades
    return Response({"trades": []}, status=200)

    # ...existing code...

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_interested_trades(request):
    """
    Returns trades the authenticated user has expressed interest in.
    ✅ ONLY shows PENDING interests (not cancelled, not accepted)
    Fixed to return proper nested structure matching frontend expectations.
    """
    user = request.user

    # ✅ Filter to ONLY show PENDING interests
    # - CANCELLED interests should not appear
    # - ACCEPTED interests should appear in "Trades for confirmation" instead
    interests_qs = TradeInterest.objects.filter(
        interested_user=user,
        status=TradeInterest.InterestStatus.PENDING  # ✅ Only PENDING
    ).select_related('trade_request__requester').order_by('-created_at')

    # Global fallback for offer field
    any_spec = SpecSkill.objects.first()
    fallback_spec_name = getattr(any_spec, "specName", "") if any_spec else ""

    result = []
    for interest in interests_qs:
        tr = interest.trade_request
        requester = tr.requester

        # Determine offer from requester's skills
        offer = ""
        try:
            first_us = UserSkill.objects.filter(user=requester).select_related("specSkills__genSkills_id").first()
            if first_us and getattr(first_us, "specSkills", None):
                spec = first_us.specSkills
                spec_name = getattr(spec, "specName", "") or ""
                gen = getattr(spec, "genSkills_id", None)
                gen_categ = getattr(gen, "genCateg", "") if gen else ""
                offer = spec_name or gen_categ or ""
        except Exception:
            offer = ""

        if not offer:
            offer = fallback_spec_name

        # ✅ Build proper structure matching frontend expectations
        result.append({
            "id": interest.trade_interests_id,
            "interest_id": interest.trade_interests_id,
            "status": interest.status,
            "name": f"{requester.first_name} {requester.last_name}".strip() or requester.username,
            "rating": float(requester.avgStars or 0),
            "reviews": str(requester.ratingCount or 0),
            "level": str(requester.level or 1),
            "needs": tr.reqname,
            "offers": offer,
            "until": tr.reqdeadline.strftime('%B %d') if tr.reqdeadline else "No deadline",
            "created_at": interest.created_at.isoformat() if getattr(interest, "created_at", None) else None,
            
            # ✅ Add nested requester object for profile links
            "requester": {
                "id": requester.id,
                "username": requester.username,
                "profile_pic": requester.profilePic if requester.profilePic else None,
                "first_name": requester.first_name,
                "last_name": requester.last_name,
            }
        })

    return Response({"interested_trades": result, "count": len(result)}, status=200)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def trade_again(request):
    """
    Create a new trade between users who previously traded.
    Automatically creates a PENDING trade without details.
    Both users will need to add trade details in "Trades for confirmation".
    """
    partner_username = request.data.get('trade_partner_username')
    
    if not partner_username:
        return Response({"error": "Partner username is required"}, status=400)
    
    try:
        # Find the partner user
        partner = User.objects.get(username=partner_username)
        
        # Prevent trading with yourself
        if partner.id == request.user.id:
            return Response({"error": "Cannot trade with yourself"}, status=400)
        
        # Check if there's already an ACTIVE or PENDING trade between these users
        existing_active_trade = TradeRequest.objects.filter(
            Q(requester=request.user, responder=partner) |
            Q(requester=partner, responder=request.user),
            status__in=[TradeRequest.Status.PENDING, TradeRequest.Status.ACTIVE]
        ).first()
        
        if existing_active_trade:
            return Response({
                "error": "You already have an active or pending trade with this user",
                "tradereq_id": existing_active_trade.tradereq_id
            }, status=400)
        
        # Get the most recent COMPLETED trade for context
        previous_trade = TradeRequest.objects.filter(
            Q(requester=request.user, responder=partner) |
            Q(requester=partner, responder=request.user),
            status=TradeRequest.Status.COMPLETED
        ).order_by('-created_at').first()
        
        if not previous_trade:
            return Response({
                "error": "No previous completed trade found with this user to base a new trade on."
            }, status=404)
        
        # ✅ CREATE NEW TRADE REQUEST
        # ✅ Use previous trade info as requested
        new_trade = TradeRequest.objects.create(
            requester=request.user,
            responder=partner,
            reqname=previous_trade.reqname,  # ✅ Retain previous request name
            reqdeadline=None,  # Set to None as no details are provided
            status=TradeRequest.Status.PENDING,  # ✅ Goes straight to "Trades for confirmation"
            exchange=previous_trade.exchange  # ✅ Retain previous exchange name
        )
        
        print(f"✅ Created new trade request {new_trade.tradereq_id} between {request.user.username} and {partner.username}")
        
        # ✅ CREATE CONVERSATION
        conversation, _ = Conversation.objects.get_or_create(
            trade_request=new_trade,
            defaults={
                'requester': new_trade.requester,
                'responder': new_trade.responder,
            }
        )
        
        print(f"✅ Created conversation {conversation.conversation_id} for trade {new_trade.tradereq_id}")
        
        return Response({
            "message": "Trade request created successfully! Add your trade details.",
            "tradereq_id": new_trade.tradereq_id,
            "status": "PENDING",
            "requires_details": True,
            "redirect": "pending_trades"
        }, status=201)
            
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)
    except Exception as e:
        print(f"❌ Trade again error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            "error": f"Failed to create trade request: {str(e)}"
        }, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_completed_trades(request):
    """
    Get all COMPLETED trades where the user was a participant (requester or responder).
    This is specifically for the completed trades history page.
    ✅ CORRECTED: Now swaps 'reqname' and 'exchange' based on user's perspective.
    """
    user = request.user
    print(f"=== GET_COMPLETED_TRADES (Corrected) DEBUG ===")
    print(f"User ID: {user.id}")

    try:
        completed_trades_query = TradeRequest.objects.filter(
            status=TradeRequest.Status.COMPLETED,
            requester__isnull=False,
            responder__isnull=False
        ).filter(
            Q(requester=user) | Q(responder=user)
        ).select_related('requester', 'responder').order_by('-tradereq_id')

        print(f"Found {completed_trades_query.count()} completed trades for user {user.id}")

        trades_data = []
        for trade in completed_trades_query:
            is_requester = (trade.requester.id == user.id)
            other_user = trade.responder if is_requester else trade.requester

            if not other_user:
                print(f"Skipping trade {trade.tradereq_id} due to missing other_user")
                continue

            if is_requester:
                user_perspective_needed = trade.reqname
                user_perspective_offered = trade.exchange
            else:
                user_perspective_needed = trade.exchange
                user_perspective_offered = trade.reqname

            profile_pic_url = other_user.profilePic if other_user.profilePic else None

            user_trade_detail = TradeDetail.objects.filter(trade_request=trade, user=user).first()
            total_xp = user_trade_detail.total_xp if user_trade_detail else 0

            trade_history = TradeHistory.objects.filter(trade_request=trade).first()
            completed_at = trade_history.completed_at if trade_history and trade_history.completed_at else None
            
            deadline_formatted = completed_at.strftime('%B %d, %Y') if completed_at else "Date not available"

            trades_data.append({
                "tradereq_id": trade.tradereq_id,
                "other_user": {
                    "id": other_user.id,
                    "name": f"{other_user.first_name} {other_user.last_name}".strip() or other_user.username,
                    "username": other_user.username,
                    "profilePic": profile_pic_url,
                    "level": other_user.level,
                    "rating": float(other_user.avgStars or 0)
                },
                "reqname": user_perspective_needed,
                "exchange": user_perspective_offered,
                "total_xp": total_xp,
                "deadline": completed_at.isoformat() if completed_at else None,
                "deadline_formatted": deadline_formatted,
                "is_requester": is_requester,
                "status": trade.status,
            })

        return Response({
            "completed_trades": trades_data,
            "count": len(trades_data)
        }, status=200)

    except Exception as e:
        print(f"ERROR in get_completed_trades: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            "error": f"Failed to get completed trades: {str(e)}",
            "completed_trades": [],
            "count": 0
        }, status=500)
        
# 1. Send OTP (when user submits Step 1)
@api_view(['POST'])
@permission_classes([AllowAny])
def send_verification_otp(request):
    """Send OTP to email for verification - with complete Step 1 data"""
    email = request.data.get('email')
    username = request.data.get('username')
    first_name = request.data.get('first_name', '')
    last_name = request.data.get('last_name', '')
    password = request.data.get('password')
    
    if not email or not username:
        return Response({"error": "Email and username are required"}, status=400)
    
    try:
        # Check if user already exists
        existing_user = User.objects.filter(Q(username=username) | Q(email=email)).first()
        
        if existing_user:
            # Check if already verified
            if existing_user.verification.email_verified:
                return Response({"error": "Email already registered and verified"}, status=400)
            
            # User exists but not verified - update their info and resend OTP
            user = existing_user
            user.username = username
            user.first_name = first_name
            user.last_name = last_name
            user.email = email
            if password:
                user.set_password(password)
            user.save()
            print(f"[INFO] Updated existing unverified user: {user.id}")
        else:
            # Create new user with correct username
            user = User.objects.create(
                email=email,
                username=username,
                first_name=first_name,
                last_name=last_name,
            )
            if password:
                user.set_password(password)
                user.save()
            print(f"[INFO] Created new user for OTP: {user.id}")
        
        # Generate and store OTP
        otp_code = generate_otp()
        verification, _ = UserVerification.objects.get_or_create(user=user)
        verification.email_verification_otp = otp_code
        verification.email_otp_created_at = django_timezone.now()
        verification.email_verified = False
        verification.save()
        
        # Send email
        send_otp_email(user, otp_code)
        
        return Response({
            "message": "OTP sent successfully",
            "email": email,
            "username": username
        }, status=200)
        
    except Exception as e:
        print(f"[ERROR] Send OTP error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"error": "Failed to send OTP. Please try again."}, status=500)

# 2. Verify OTP
@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp(request):
    """Verify OTP code"""
    email = request.data.get('email')
    otp_code = request.data.get('otp')
    
    if not email or not otp_code:
        return Response({"error": "Email and OTP are required"}, status=400)
    
    try:
        user = User.objects.get(email=email)
        verification = user.verification
        
        # Check if OTP exists
        if not verification.email_verification_otp:
            return Response({"error": "No OTP found. Please request a new one."}, status=400)
        
        # Check if OTP expired (5 minutes)
        if not verification.email_otp_created_at:
            return Response({"error": "OTP session expired. Please request a new one."}, status=400)
            
        time_diff = (django_timezone.now() - verification.email_otp_created_at).total_seconds()
        if time_diff > 300:
            return Response({"error": "OTP expired. Please request a new one."}, status=400)
        
        # Check if OTP matches (case-insensitive, strip whitespace)
        if verification.email_verification_otp.strip() != otp_code.strip():
            return Response({"error": "Invalid OTP code"}, status=400)
        
        # ✅ Mark email as verified
        verification.email_verified = True
        verification.email_verified_at = django_timezone.now()
        verification.email_verification_otp = None  # Clear OTP for security
        verification.email_otp_created_at = None
        verification.save()
        
        print(f"[SUCCESS] Email verified for user: {user.email}")
        
        return Response({
            "message": "Email verified successfully",
            "email": email,
            "verified": True
        }, status=200)
        
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)
    except Exception as e:
        print(f"[ERROR] Verify OTP error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"error": "Verification failed. Please try again."}, status=500)


# 3. Resend OTP
@api_view(['POST'])
@permission_classes([AllowAny])
def resend_otp(request):
    """Resend OTP code"""
    email = request.data.get('email')
    
    if not email:
        return Response({"error": "Email is required"}, status=400)
    
    try:
        user = User.objects.get(email=email)
        verification = user.verification
        
        # Check cooldown (5 minutes)
        if verification.email_otp_created_at:
            time_diff = (django_timezone.now() - verification.email_otp_created_at).total_seconds()
            if time_diff < 300:
                remaining = int(300 - time_diff)
                return Response({
                    "error": f"Please wait {remaining} seconds before requesting a new code"
                }, status=429)
        
        # Generate new OTP
        otp_code = generate_otp()
        verification.email_verification_otp = otp_code
        verification.email_otp_created_at = django_timezone.now()
        verification.save()
        
        # Send email with HTML template
        send_otp_email(user, otp_code)
        
        print(f"[SUCCESS] OTP resent to {user.email}")
        
        return Response({
            "message": "New OTP sent successfully"
        }, status=200)
        
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)
    except Exception as e:
        print(f"[ERROR] Resend OTP error: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"error": "Failed to resend OTP. Please try again."}, status=500)
    
# [PALITAN] 'yung luma mong list_notifications function
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_notifications(request):
    """
    Get all notifications for the current user, plus the unread count.
    REVISED: Fetches ALL notifications (read and unread) to keep them in the list.
    """
    try:
        # Fetch all notifications for the user, ordered by newest first
        all_notifications = Notification.objects.filter(
            recipient=request.user
        ).order_by('-created_at')
        
        # Count unread notifications separately
        unread_count = all_notifications.filter(is_read=False).count()
        
        serializer = NotificationSerializer(all_notifications, many=True)
        
        return Response({
            "count": unread_count, # Number of unread notifications
            "notifications": serializer.data # List of all notifications
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"Error in list_notifications: {str(e)}")
        return Response({"error": "Failed to fetch notifications"}, status=500)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_notification(request, notification_id):
    """
    [NEW] Delete a single notification by its ID.
    Para sa 'X' button.
    """
    try:
        notification = Notification.objects.get(
            notification_id=notification_id,
            recipient=request.user # Security: user can only delete their own
        )
        notification.delete()
        return Response({"message": "Notification deleted"}, status=status.HTTP_200_OK)
    except Notification.DoesNotExist:
        return Response({"error": "Notification not found"}, status=status.HTTP_404)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_all_read_notifications(request):
    """
    [NEW] Delete all notifications for the user that are 'is_read' = True.
    Para sa 'Delete all read' option.
    """
    try:
        deleted_count, _ = Notification.objects.filter(
            recipient=request.user,
            is_read=True # Buburahin lang 'yung nabasa na
        ).delete()
        
        return Response({
            "message": f"Deleted {deleted_count} read notifications."
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_all_as_read(request):
    """
    Mark all unread notifications for the current user as read.
    """
    try:
        updated_count = Notification.objects.filter(
            recipient=request.user, 
            is_read=False
        ).update(is_read=True)
        
        return Response({
            "message": "All notifications marked as read.",
            "updated_count": updated_count
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"Error in mark_all_as_read: {str(e)}")
        return Response({"error": "Failed to mark notifications as read"}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_one_as_read(request, notification_id):
    """
    Mark a single notification as read.
    """
    try:
        notification = Notification.objects.get(
            notification_id=notification_id,
            recipient=request.user
        )
        if not notification.is_read:
            notification.is_read = True
            notification.save()
            
        return Response({
            "message": "Notification marked as read.",
            "notification_id": notification_id
        }, status=status.HTTP_200_OK)
        
    except Notification.DoesNotExist:
        return Response({"error": "Notification not found or access denied"}, status=404)
    except Exception as e:
        return Response({"error": "Failed to mark notification as read"}, status=500)