import { createContext } from "react";

export interface TokenExpiredContextType {
  showDialog: () => void;
  hideDialog: () => void;
  isDialogOpen: boolean;
  isHandlingTokenExpiration: boolean;
  setHandlingTokenExpiration: (value: boolean) => void;
}

export const TokenExpiredContext = createContext<
  TokenExpiredContextType | undefined
>(undefined);
