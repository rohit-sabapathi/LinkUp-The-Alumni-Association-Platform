from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import UserFollowing, FollowRequest, CustomUser, Skill, Notification

User = get_user_model()

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    email = serializers.EmailField(required=True)
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    username = serializers.CharField(required=True)

    class Meta:
        model = User
        fields = ('email', 'username', 'password', 'password2', 'first_name', 'last_name', 
                 'user_type', 'profile_picture', 'bio', 'graduation_year', 'department')

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user

class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ['id', 'name', 'category']

class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    follower_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()
    follow_request_sent = serializers.SerializerMethodField()
    skills = SkillSerializer(many=True, read_only=True)
    skill_names = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = CustomUser
        fields = [
            'id', 'email', 'username', 'password', 'first_name', 'last_name',
            'user_type', 'profile_picture', 'bio', 'graduation_year',
            'department', 'current_position', 'company', 'location',
            'linkedin_profile', 'github_profile', 'website', 'skills',
            'skill_names', 'full_name', 'follower_count', 'following_count',
            'is_following', 'follow_request_sent'
        ]
        extra_kwargs = {
            'password': {'write_only': True},
            'profile_picture': {'required': False},
        }
        read_only_fields = ['email']

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()

    def get_follower_count(self, obj):
        return UserFollowing.objects.filter(following_user=obj).count()

    def get_following_count(self, obj):
        return UserFollowing.objects.filter(user=obj).count()

    def get_is_following(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            if request.user.id == obj.id:
                return None  # Return None for the user's own profile
            return UserFollowing.objects.filter(
                user=request.user,
                following_user=obj
            ).exists()
        return False

    def get_follow_request_sent(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            if request.user.id == obj.id:
                return None  # Return None for the user's own profile
            return FollowRequest.objects.filter(
                from_user=request.user,
                to_user=obj,
                status='pending'
            ).exists()
        return False

    def create(self, validated_data):
        skill_names = validated_data.pop('skill_names', [])
        password = validated_data.pop('password')
        user = CustomUser(**validated_data)
        user.set_password(password)
        user.save()

        # Add skills
        for skill_name in skill_names:
            skill, _ = Skill.objects.get_or_create(
                name=skill_name,
                defaults={'category': 'TECH'}
            )
            user.skills.add(skill)

        return user

    def update(self, instance, validated_data):
        skill_names = validated_data.pop('skill_names', None)
        password = validated_data.pop('password', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        if skill_names is not None:
            instance.skills.clear()
            for skill_name in skill_names:
                skill, _ = Skill.objects.get_or_create(
                    name=skill_name,
                    defaults={'category': 'TECH'}
                )
                instance.skills.add(skill)

        instance.save()
        return instance
