from django.urls import path
from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path('profile', views.profile, name='profile'),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    # path('search', views.search, name='search'),
    path("rooms/<int:room_id>/reserve", views.reserve, name="reserve"),
    path('rooms/<int:room_id>', views.room, name='room')

]