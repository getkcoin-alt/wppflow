import { createContext, useContext } from "react";

// Which industry solutions the signed-in company has been given. The universal product never reads this: a company with
// none sees exactly what it always saw. The app provides it (SolutionsContext.Provider) from the workspace capabilities.
export const SolutionsContext = createContext<string[]>([]);

export const useSolutions = () => useContext(SolutionsContext);
export const useHasSolution = (key: string) => useContext(SolutionsContext).includes(key);
