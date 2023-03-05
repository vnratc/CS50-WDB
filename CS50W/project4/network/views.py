import json
from django import forms
from django.core.paginator import Paginator
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.urls import reverse

from .models import User, Post


def paginate(list, request):
    paginator = Paginator(list, 10)
    page_number = request.GET.get('page')
    return paginator.get_page(page_number)


def index(request):
    posts = Post.objects.all().order_by("-timestamp").all()
    page_obj = paginate(posts, request)
    # TRY JSON() OR TXT(). Solve new lines in body. The following didn't work
    # for post in posts:
    #     post.body = post.body.replace("\n", "<br>")
    return render(request, "network/index.html", {
        "new_post_form": NewPostForm,
        "page_obj": page_obj
    })


@login_required()
def profile(request, user_id):
    # Get data about viewed user
    profile = User.objects.get(pk=user_id)
    # user_posts is a related name inside Post class
    profile_posts = profile.user_posts.all().order_by("-timestamp").all()
    page_obj = paginate(profile_posts, request)
    # Get data about logged in user
    user = User.objects.get(pk=request.user.id)
    return render(request, "network/profile.html", {
        "profile": profile,
        "page_obj": page_obj,
        "user_following": user.following.all(),
        "following": profile.following.all(),
        "followers": profile.followers.all(),
        "following_count": profile.following.count(),
        "followers_count": profile.followers.count()
    })


@login_required()
def following(request):
    user = User.objects.get(pk=request.user.id)
    followed_users = user.following.all()
    posts = Post.objects.filter(user__in=followed_users)    # all posts made by users that the current user follows
    posts = posts.order_by("-timestamp").all()
    page_obj = paginate(posts, request)
    return render(request, "network/following.html", {
        "page_obj": page_obj
    })
    

class NewPostForm(forms.Form):
    body = forms.CharField(label="New Post", widget=forms.Textarea(attrs={'rows': 4, 'class': 'form-control mb-2', 'aria-label': 'New Post'}))


@login_required()
def new_post(request):
    if request.method == 'POST':
        form = NewPostForm(request.POST)
        if form.is_valid():
            body = form.cleaned_data["body"]
            post = Post(body=body, user=request.user)
            post.save()
            return HttpResponseRedirect(reverse("index"))
        else:
            return HttpResponse('Invalid Form')
    else:
        return HttpResponseRedirect(reverse("index"))
    

@login_required()
def edit_post(request, post_id):
    # Check if requested post is in current users' posts
    user = User.objects.get(pk=request.user.id)
    post = Post.objects.get(pk=post_id)
    if not post in user.user_posts.all():
        return HttpResponse('Post belongs to another user')
    return JsonResponse(post.serialize())


@csrf_exempt
@login_required()
def save_edit(request, post_id):
    data = json.loads(request.body)
    post = Post.objects.get(pk=post_id)
    # Update db and return new text body(probably with a new editing date)
    print(data)
    return JsonResponse(post.serialize())


@login_required() 
def follow(request, user_id):
    if request.method == 'POST':
        profile = User.objects.get(pk=user_id)
        print(profile.id)
        user = User.objects.get(pk=request.user.id)
        print(user.id)
        user.following.add(profile)
        profile.followers.add(user)
        return HttpResponseRedirect(reverse("profile", args=(user_id,)))
    return HttpResponseRedirect(reverse("profile", args=(user_id,)))

@login_required()
def unfollow(request, user_id):
    if request.method == 'POST':
        profile = User.objects.get(pk=user_id)
        user = User.objects.get(pk=request.user.id)
        user.following.remove(profile)
        profile.followers.remove(user)
        return HttpResponseRedirect(reverse("profile", args=(user_id,)))
    return HttpResponseRedirect(reverse("profile", args=(user_id,)))


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")