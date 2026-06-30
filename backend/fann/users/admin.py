from django.contrib import admin

from fann.users.models import (
    User,
    KYCSubmission,
    UserAccount,
    VerificationCode,
    UserVerifications,
    OrgSecuritySetting,
    CommunityChallenge,
    ChallengeParticipant,
    KYCVerification,
    UserReferral, UserWithDrawRequests,
)

# Register your models here.
admin.site.register(User)
admin.site.register(KYCSubmission)
admin.site.register(UserAccount)
admin.site.register(UserWithDrawRequests)
admin.site.register(VerificationCode)
admin.site.register(UserVerifications)
admin.site.register(OrgSecuritySetting)
admin.site.register(CommunityChallenge)
admin.site.register(ChallengeParticipant)
admin.site.register(KYCVerification)
admin.site.register(UserReferral)
