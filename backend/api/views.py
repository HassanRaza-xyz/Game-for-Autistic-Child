from django.contrib.auth.models import User
from django.db import transaction
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Profile, Session
from .serializers import (
	DEFAULT_SETTINGS,
	EmailTokenObtainPairSerializer,
	ProfileSerializer,
	RegisterSerializer,
	SessionSerializer,
)

LEVEL_NAMES = {1: 'Bird Flight (Volume)', 2: 'Vowel Finder', 3: 'Emotion Match'}


def build_stats(sessions):
	if not sessions:
		return {
			'totalSessions': 0,
			'totalScore': 0,
			'bestScore': 0,
			'averageAccuracy': 0,
			'levelBreakdown': {
				1: {'played': 0, 'bestScore': 0, 'totalScore': 0, 'avgAccuracy': 0},
				2: {'played': 0, 'bestScore': 0, 'totalScore': 0, 'avgAccuracy': 0},
				3: {'played': 0, 'bestScore': 0, 'totalScore': 0, 'avgAccuracy': 0},
			},
			'recentSessions': [],
		}

	total_score = sum(s.score or 0 for s in sessions)
	best_score = max(s.score or 0 for s in sessions)
	avg_accuracy = sum(s.accuracy or 0 for s in sessions) / len(sessions)

	level_breakdown = {}
	for level in [1, 2, 3]:
		lvl_sessions = [s for s in sessions if s.level == level]
		level_breakdown[level] = {
			'played': len(lvl_sessions),
			'bestScore': max((s.score or 0) for s in lvl_sessions) if lvl_sessions else 0,
			'totalScore': sum(s.score or 0 for s in lvl_sessions),
			'avgAccuracy': (
				sum(s.accuracy or 0 for s in lvl_sessions) / len(lvl_sessions)
				if lvl_sessions else 0
			),
		}

	return {
		'totalSessions': len(sessions),
		'totalScore': total_score,
		'bestScore': best_score,
		'averageAccuracy': round(avg_accuracy),
		'levelBreakdown': level_breakdown,
		'recentSessions': SessionSerializer(sessions[:20], many=True).data,
	}


class RegisterView(APIView):
	permission_classes = [permissions.AllowAny]

	def post(self, request):
		serializer = RegisterSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		data = serializer.validated_data
		email = data['email'].strip().lower()
		password = data['password']
		child_name = data.get('child_name', '')

		if User.objects.filter(email__iexact=email).exists():
			return Response({'email': 'Email already registered.'}, status=status.HTTP_400_BAD_REQUEST)

		with transaction.atomic():
			user = User.objects.create_user(username=email, email=email, password=password)
			profile = Profile.objects.create(user=user, child_name=child_name, settings={**DEFAULT_SETTINGS})

		refresh = RefreshToken.for_user(user)
		return Response({
			'access': str(refresh.access_token),
			'refresh': str(refresh),
			'profile': ProfileSerializer(profile).data,
		}, status=status.HTTP_201_CREATED)


class LoginView(TokenObtainPairView):
	permission_classes = [permissions.AllowAny]
	serializer_class = EmailTokenObtainPairSerializer


class ProfileView(generics.RetrieveUpdateAPIView):
	serializer_class = ProfileSerializer

	def get_object(self):
		profile, _ = Profile.objects.get_or_create(
			user=self.request.user,
			defaults={'settings': {**DEFAULT_SETTINGS}},
		)
		if not profile.settings:
			profile.settings = DEFAULT_SETTINGS
			profile.save(update_fields=['settings'])
		return profile


class SessionListCreateView(generics.ListCreateAPIView):
	serializer_class = SessionSerializer

	def get_queryset(self):
		return Session.objects.filter(user=self.request.user).order_by('-created_at')

	def perform_create(self, serializer):
		serializer.save(user=self.request.user)


class StatsView(APIView):
	def get(self, request):
		sessions = list(Session.objects.filter(user=request.user).order_by('-created_at'))
		return Response(build_stats(sessions))


class ReportView(APIView):
	def get(self, request):
		sessions = list(Session.objects.filter(user=request.user).order_by('-created_at'))
		stats = build_stats(sessions)
		name = request.user.profile.child_name if hasattr(request.user, 'profile') else ''
		name = name or 'Child'

		report = 'SPEAKQUEST - SPEECH THERAPY PROGRESS REPORT\n'
		report += '=============================================\n\n'
		report += f"Child's Name: {name}\n"
		report += f"Total Sessions Played: {stats['totalSessions']}\n"
		report += f"Total Score: {stats['totalScore']}\n"
		report += f"Best Score: {stats['bestScore']}\n"
		report += f"Average Accuracy: {stats['averageAccuracy']}%\n\n"

		report += 'LEVEL BREAKDOWN:\n'
		report += '-----------------\n'
		for level in [1, 2, 3]:
			lb = stats['levelBreakdown'][level]
			report += f"\nLevel {level}: {LEVEL_NAMES.get(level, 'Level')}\n"
			report += f"  Times Played: {lb['played']}\n"
			report += f"  Best Score: {lb['bestScore']}\n"
			report += f"  Average Accuracy: {round(lb['avgAccuracy'])}%\n"

		report += '\n\nSESSION HISTORY (Last 20):\n'
		report += '--------------------------\n'
		for idx, s in enumerate(stats['recentSessions'], start=1):
			level = s.get('level')
			score = s.get('score')
			accuracy = s.get('accuracy') or 0
			report += f"{idx}. Level {level} ({LEVEL_NAMES.get(level, 'Level')}) | Score: {score} | Accuracy: {accuracy}%\n"

		report += '\n\n--- Generated by SpeakQuest Speech Therapy Game ---\n'
		return Response(report, content_type='text/plain')
