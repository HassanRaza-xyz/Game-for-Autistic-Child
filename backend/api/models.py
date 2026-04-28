from django.contrib.auth.models import User
from django.db import models


class Profile(models.Model):
	user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
	child_name = models.CharField(max_length=80, blank=True)
	settings = models.JSONField(default=dict, blank=True)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	def __str__(self) -> str:
		return f"Profile({self.user.username})"


class Session(models.Model):
	user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
	level = models.PositiveSmallIntegerField()
	score = models.IntegerField(default=0)
	accuracy = models.IntegerField(default=0)
	correct = models.IntegerField(null=True, blank=True)
	total = models.IntegerField(null=True, blank=True)
	duration = models.IntegerField(null=True, blank=True)
	created_at = models.DateTimeField(auto_now_add=True)

	def __str__(self) -> str:
		return f"Session(user={self.user.username}, level={self.level}, score={self.score})"
