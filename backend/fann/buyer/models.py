from django.db import models
from fann.users.models import User
from fann.common.model_mixins import TimestampMixin


class BuyerAddress(TimestampMixin):
    name = models.CharField(max_length=100)
    street = models.CharField(max_length=100)
    zip_code = models.CharField(max_length=100)
    country = models.CharField(max_length=100)
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="buyer_address"
    )


class UserPost(TimestampMixin):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="post_user")
    title = models.CharField(max_length=100)
    category = models.CharField(max_length=100, null=True, blank=True)
    content = models.TextField()
    link = models.URLField()
    file = models.FileField(upload_to="post", null=True, blank=True)


class PaymentMethods(TimestampMixin):
    payment_type = models.CharField(max_length=100)
    card_holder_name = models.CharField(max_length=100)
    cvv = models.CharField(max_length=100)
    card_number = models.CharField(max_length=100)
    date = models.CharField(max_length=100)
    is_primary = models.BooleanField(default=False)
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="payment_method_user"
    )
