from rest_framework import serializers


class BestPicksIn(serializers.Serializer):
    user_id = serializers.IntegerField()
    seed_trade_id = serializers.IntegerField(required=False)


class BestPicksOut(serializers.Serializer):
    trade_ids = serializers.ListField(child=serializers.IntegerField())


class CategorizeIn(serializers.Serializer):
    tradereq_id = serializers.IntegerField()


class EvaluateIn(serializers.Serializer):
    tradereq_id = serializers.IntegerField()


class EvaluateOut(serializers.Serializer):
    overall_meter_0_100 = serializers.IntegerField()
    overall_meter_0_10 = serializers.IntegerField()
    quality_label = serializers.CharField()
    metrics = serializers.DictField()
    explanation = serializers.CharField()
    evaluation_id = serializers.IntegerField(allow_null=True)


# NEW: Add this for TE1/TE2
class TradeEvaluationSerializer(serializers.Serializer):
    """Serializer for trade evaluation results (TE1, TE2)"""
    evaluation_id = serializers.IntegerField(read_only=True)
    tradereq_id = serializers.IntegerField()
    
    # Raw scores (0-100)
    taskcomplexity = serializers.IntegerField(min_value=0, max_value=100)
    timecommitment = serializers.IntegerField(min_value=0, max_value=100)
    skilllevel = serializers.IntegerField(min_value=0, max_value=100)
    overall_score = serializers.IntegerField(read_only=True)
    
    # Display versions (out of 10)
    overall_score_out_of_10 = serializers.FloatField(read_only=True)
    taskcomplexity_out_of_10 = serializers.FloatField(read_only=True)
    timecommitment_out_of_10 = serializers.FloatField(read_only=True)
    skilllevel_out_of_10 = serializers.FloatField(read_only=True)
    
    # Quality label
    quality_label = serializers.CharField(read_only=True)
    evaluationdescription = serializers.CharField(max_length=500)
    
    # Confirmation status
    requester_evaluation_status = serializers.CharField(read_only=True)
    responder_evaluation_status = serializers.CharField(read_only=True)
    requester_responded_at = serializers.DateTimeField(read_only=True)
    responder_responded_at = serializers.DateTimeField(read_only=True)


class SubmitRatingIn(serializers.Serializer):
    """Input for submitting a trade rating"""
    tradereq_id = serializers.IntegerField()
    review_text = serializers.CharField(max_length=500)