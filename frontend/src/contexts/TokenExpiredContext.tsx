import React, { useState, ReactNode, useCallback, useEffect } from "react";
import { TokenExpiredContext } from "./token-expired-context";

export function TokenExpiredProvider({ children }: { children: ReactNode }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isHandlingTokenExpiration, setIsHandlingTokenExpiration] =
    useState(false);

  const showDialog = useCallback(() => {
    setIsDialogOpen(true);
    setIsHandlingTokenExpiration(true);
  }, []);

  const hideDialog = useCallback(() => {
    setIsDialogOpen(false);
    // Keep the flag true until navigation happens
  }, []);

  const setHandlingTokenExpiration = useCallback((value: boolean) => {
    setIsHandlingTokenExpiration(value);
  }, []);

  // Listen for token-expired events from baseApi interceptor
  useEffect(() => {
    const handleTokenExpired = () => {
      // Only show dialog if it's not already open (prevent duplicates)
      if (!isDialogOpen) {
        showDialog();
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("token-expired", handleTokenExpired);
      return () => {
        window.removeEventListener("token-expired", handleTokenExpired);
      };
    }
  }, [showDialog, isDialogOpen]);

  return (
    <TokenExpiredContext.Provider
      value={{
        showDialog,
        hideDialog,
        isDialogOpen,
        isHandlingTokenExpiration,
        setHandlingTokenExpiration,
      }}
    >
      {children}
    </TokenExpiredContext.Provider>
  );
}
