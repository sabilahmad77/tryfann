import random
import string

from django.core.mail import EmailMessage
from django.template.loader import get_template

from core import settings
from fann.users.models import User, VerificationCode


def send_email(context, template_path, user_email, subject):
    """
    Send email to user
    """
    message = get_template(template_path).render(context)
    email = EmailMessage(
        subject=subject,
        body=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[user_email],
        reply_to=[settings.DEFAULT_FROM_EMAIL],
    )
    email.content_subtype = "html"
    email.send()


def generate_random_string(length=10):
    # Define the characters you want to include in the random string
    characters = string.ascii_letters + string.digits  # You can customize this further

    # Generate the random string
    random_string = "".join(random.choice(characters) for _ in range(length))

    return random_string


def expire_previous_code(user: User):
    """
    Expire previous verification code
    """
    previous_code = VerificationCode.objects.filter(user=user, is_active=True)
    if previous_code.exists():
        previous_code.update(is_active=False)


def create_verification(user: User):
    """
    Create a verification code for the user
    """
    code = random.randint(100000, 999999)
    verification = VerificationCode.objects.filter(code=code)
    if verification.exists():
        create_verification(user=user)
    expire_previous_code(user=user)
    VerificationCode.objects.create(code=code, user=user)
    return code


def forget_password_email(user: User, template: str = "verify_email.html"):
    """
    Send email to user
    """
    code = (create_verification(user=user),)
    rtx = {
        "user_name": user.first_name + " " + user.last_name,
        "reset_url": f"https://app.globaltechserivce.com/reset-password?code={code[0]}",
    }
    send_email(rtx, template, user.email)
