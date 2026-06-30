import type { UserProfileData } from "@/store/authSlice";

/**
 * Parse get_user_details API response
 * Response structure: { success, status_code, message, data: { user, kyc_verification, interest_rewards } }
 */
export function parseGetUserDetailsResponse(response: unknown): {
    user?: UserProfileData;
    kyc_verification?: {
        id?: number;
        id_number?: string;
        dob?: string;
        nationality?: string;
        city?: string;
        postal_code?: string;
        street_address?: string;
        gov_issued_id?: string | null;
        proof_address?: string | null;
        social_link_handler?: string | null;
        social_link_followers?: string | null;
    };
    interest_rewards?: unknown[];
} {
    if (!response || typeof response !== "object") {
        return {};
    }

    const apiResponse = response as {
        success?: boolean;
        status_code?: number;
        message?: unknown;
        data?: {
            user?: UserProfileData;
            kyc_verification?: {
                id?: number;
                id_number?: string;
                dob?: string;
                nationality?: string;
                city?: string;
                postal_code?: string;
                street_address?: string;
                gov_issued_id?: string | null;
                proof_address?: string | null;
                social_link_handler?: string | null;
                social_link_followers?: string | null;
            };
            interest_rewards?: unknown[];
            [key: string]: unknown;
        };
        [key: string]: unknown;
    };

    if (apiResponse.data) {
        return {
            user: apiResponse.data.user,
            kyc_verification: apiResponse.data.kyc_verification,
            interest_rewards: apiResponse.data.interest_rewards,
        };
    }

    return {};
}

/**
 * Map profile_step to onboarding step index
 * @param profileStep - Profile step value from API (string: "0", "1", "2", "3", "4", "5")
 * @param persona - User persona ("artist", "gallery", "collector", "ambassador")
 * @returns Step index (0-based) for ProfileCompletion component
 */
export function mapProfileStepToOnboardingStep(
    profileStep: string | null | undefined,
    persona: string
): number {
    // Convert profile_step to number, default to 0 if invalid
    const step = profileStep ? parseInt(profileStep, 10) : 0;
    const isAmbassador = persona === "ambassador";

    if (isAmbassador) {
        // Ambassador flow: [AmbassadorInfoStep, KYCStep, GamificationStep, CompletionStep]
        // profile_step: "0" or "1" = step 0 (AmbassadorInfoStep)
        // profile_step: "2" or "3" = step 1 (KYCStep)
        // profile_step: "4" = step 2 (GamificationStep)
        // profile_step: "5" or higher = step 3 (CompletionStep)
        if (step === 0 || step === 1) return 0;
        if (step === 2 || step === 3) return 1;
        if (step === 4) return 2;
        return 3; // step >= 5
    } else {
        // Non-ambassador flow: [PersonaDetailsStep, InterestsStep, KYCStep, GamificationStep, CompletionStep]
        // profile_step: "0" or "1" = step 0 (PersonaDetailsStep)
        // profile_step: "2" = step 1 (InterestsStep)
        // profile_step: "3" = step 2 (KYCStep)
        // profile_step: "4" = step 3 (GamificationStep)
        // profile_step: "5" or higher = step 4 (CompletionStep)
        if (step === 0 || step === 1) return 0;
        if (step === 2) return 1;
        if (step === 3) return 2;
        if (step === 4) return 3;
        return 4; // step >= 5
    }
}

/**
 * Safely merge user data, preserving existing values when new values are null/undefined
 */
export function mergeUserData(
    existingUser: UserProfileData | null,
    newUserData: Partial<UserProfileData>
): UserProfileData {
    if (!existingUser) {
        // If no existing user, return new data as UserProfileData
        // Note: This should not happen in practice, but handle it gracefully
        return newUserData as UserProfileData;
    }

    // Merge data, preferring new values but preserving existing if new is null/undefined
    const merged: UserProfileData = { ...existingUser };

    Object.keys(newUserData).forEach((key) => {
        const typedKey = key as keyof UserProfileData;
        const newValue = newUserData[typedKey];

        // Only update if new value is not null/undefined
        if (newValue !== null && newValue !== undefined) {
            merged[typedKey] = newValue as never;
        }
    });

    return merged;
}

