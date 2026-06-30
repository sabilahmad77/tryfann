import { useContext } from 'react';
import { TokenExpiredContext } from './token-expired-context';

export function useTokenExpired() {
  const context = useContext(TokenExpiredContext);
  if (context === undefined) {
    throw new Error(
      'useTokenExpired must be used within a TokenExpiredProvider'
    );
  }
  return context;
}

