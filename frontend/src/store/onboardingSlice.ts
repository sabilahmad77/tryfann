import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface OnboardingState {
  currentStep: number;
  onboardingData: {
    persona: string;
    personaDetails: Record<string, unknown>;
    interests: Record<string, unknown>;
    kyc: Record<string, unknown>;
    gamification: Record<string, unknown>;
  };
  submittedSteps: number[]; // Track which steps have been submitted via API (using array instead of Set for Redux compatibility)
  submittedData: {
    // Store the last submitted data for each step to compare changes
    personaDetails?: Record<string, unknown>;
    interests?: Record<string, unknown>;
    kyc?: Record<string, unknown>;
    gamification?: Record<string, unknown>;
  };
}

const initialState: OnboardingState = {
  currentStep: 0,
  onboardingData: {
    persona: '',
    personaDetails: {},
    interests: {},
    kyc: {},
    gamification: {},
  },
  submittedSteps: [],
  submittedData: {},
};

const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState,
  reducers: {
    setCurrentStep: (state, action: PayloadAction<number>) => {
      state.currentStep = action.payload;
    },
    setOnboardingData: (
      state,
      action: PayloadAction<Partial<OnboardingState['onboardingData']>>
    ) => {
      state.onboardingData = { ...state.onboardingData, ...action.payload };
    },
    updateStepData: (
      state,
      action: PayloadAction<{
        stepKey: 'personaDetails' | 'interests' | 'kyc' | 'gamification';
        data: Record<string, unknown>;
      }>
    ) => {
      state.onboardingData[action.payload.stepKey] = action.payload.data;
    },
    markStepAsSubmitted: (
      state,
      action: PayloadAction<{
        stepIndex: number;
        stepKey: 'personaDetails' | 'interests' | 'kyc' | 'gamification';
        data: Record<string, unknown>;
      }>
    ) => {
      if (!state.submittedSteps.includes(action.payload.stepIndex)) {
        state.submittedSteps.push(action.payload.stepIndex);
      }
      state.submittedData[action.payload.stepKey] = action.payload.data;
    },
    resetOnboarding: (state) => {
      state.currentStep = 0;
      state.onboardingData = initialState.onboardingData;
      state.submittedSteps = [];
      state.submittedData = {};
    },
    initializeOnboarding: (
      state,
      action: PayloadAction<{ persona: string }>
    ) => {
      state.onboardingData.persona = action.payload.persona;
      state.currentStep = 0;
    },
  },
});

export const {
  setCurrentStep,
  setOnboardingData,
  updateStepData,
  markStepAsSubmitted,
  resetOnboarding,
  initializeOnboarding,
} = onboardingSlice.actions;

// Selectors
export const selectCurrentStep = (state: { onboarding: OnboardingState }) =>
  state.onboarding.currentStep;

export const selectOnboardingData = (state: { onboarding: OnboardingState }) =>
  state.onboarding.onboardingData;

export const selectIsStepSubmitted = (
  state: { onboarding: OnboardingState },
  stepIndex: number
) => {
  return state.onboarding.submittedSteps.includes(stepIndex);
};

export const selectSubmittedData = (
  state: { onboarding: OnboardingState },
  stepKey: 'personaDetails' | 'interests' | 'kyc' | 'gamification'
) => {
  return state.onboarding.submittedData[stepKey];
};

export default onboardingSlice.reducer;

