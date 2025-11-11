"""
Test admin API endpoints
Run: python test_admin_api.py
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_trade_stats():
    print("\n📊 Testing Trade Stats...")
    response = requests.get(f"{BASE_URL}/api/admin/trade-stats/")
    print(f"Status: {response.status_code}")
    if response.ok:
        data = response.json()
        print(f"Total Trades: {data['total_trades']}")
        print(f"Completed: {data['completed_trades']}")
        print(f"Monthly Data: {len(data['monthly_breakdown'])} months")
    else:
        print(f"Error: {response.text}")

def test_top_traders():
    print("\n🏆 Testing Top Traders...")
    response = requests.get(f"{BASE_URL}/api/admin/top-traders/?limit=5")
    print(f"Status: {response.status_code}")
    if response.ok:
        data = response.json()
        print(f"Found {data['count']} top traders")
        for trader in data['top_traders'][:3]:
            print(f"  - {trader['name']}: {trader['trades']} trades, {trader['rating']}⭐")
    else:
        print(f"Error: {response.text}")

def test_recent_activity():
    print("\n📋 Testing Recent Activity...")
    response = requests.get(f"{BASE_URL}/api/admin/recent-activity/?limit=5")
    print(f"Status: {response.status_code}")
    if response.ok:
        data = response.json()
        print(f"Found {data['count']} activities")
        for activity in data['activities'][:3]:
            print(f"  - {activity['type']}: {activity['description'][:50]}")
    else:
        print(f"Error: {response.text}")

def test_trade_details():
    print("\n📝 Testing Trade Details...")
    response = requests.get(f"{BASE_URL}/api/admin/trade-details/?per_page=5")
    print(f"Status: {response.status_code}")
    if response.ok:
        data = response.json()
        print(f"Total trades: {data['pagination']['total']}")
        print(f"Showing page {data['pagination']['page']}")
        for trade in data['trades'][:3]:
            print(f"  - {trade['reqname']}: {trade['status']}")
    else:
        print(f"Error: {response.text}")

if __name__ == "__main__":
    print("🧪 Testing Admin API Endpoints...")
    test_trade_stats()
    test_top_traders()
    test_recent_activity()
    test_trade_details()
    print("\n✅ All tests completed!")