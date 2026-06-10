// context/AppContext.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { deleteUser, onAuthStateChanged, signOut, User } from "firebase/auth";
import React, { createContext, useContext, useEffect, useState } from "react";
import {
  DEFAULT_NON_NEGS,
  DEFAULT_REQUIREMENTS_GIRL, DEFAULT_REQUIREMENTS_GUY,
  emptyCandidate
} from "../constants/data";
import { auth } from "../firebaseConfig";

type Requirement = { id: string; label: string };
type NonNeg = { id: string; label: string; trigger: string };
type Candidate = ReturnType<typeof emptyCandidate>;

type AppContextType = {
  gender: "girl" | "guy";
  setGender: (g: "girl" | "guy") => void;
  lang: "en" | "es";
  setLang: (l: "en" | "es") => void;
  candidates: Candidate[];
  addCandidate: (c: Candidate) => void;
  updateCandidate: (c: Candidate) => void;
  deleteCandidate: (id: string) => void;
  requirements: Requirement[];
  setRequirements: (r: Requirement[]) => void;
  nonNegs: NonNeg[];
  setNonNegs: (n: NonNeg[]) => void;
  resetAll: () => void;
  user: User | null;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
};

const AppContext = createContext<AppContextType>({} as AppContextType);

const KEYS = {
  candidates: 'rotation_candidates',
  requirements: 'rotation_requirements',
  nonNegs: 'rotation_nonneg',
  gender: 'rotation_gender',
  lang: 'rotation_lang',
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [gender, setGenderState] = useState<"girl" | "guy">("girl");
  const [lang, setLangState] = useState<"en" | "es">("en");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [requirements, setRequirementsState] = useState<Requirement[]>(DEFAULT_REQUIREMENTS_GIRL);
  const [nonNegs, setNonNegsState] = useState<NonNeg[]>(DEFAULT_NON_NEGS);
  const [loaded, setLoaded] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return unsub;
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const [cands, reqs, nns, g, l] = await Promise.all([
          AsyncStorage.getItem(KEYS.candidates),
          AsyncStorage.getItem(KEYS.requirements),
          AsyncStorage.getItem(KEYS.nonNegs),
          AsyncStorage.getItem(KEYS.gender),
          AsyncStorage.getItem(KEYS.lang),
        ]);
        if (cands) setCandidates(JSON.parse(cands));
        if (reqs) setRequirementsState(JSON.parse(reqs));
        if (nns) setNonNegsState(JSON.parse(nns));
        if (g) setGenderState(g as "girl" | "guy");
        if (l) setLangState(l as "en" | "es");
      } catch (e) {
        console.log('Load error', e);
      }
      setLoaded(true);
    };
    load();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(KEYS.candidates, JSON.stringify(candidates)).catch(e => console.log(e));
  }, [candidates, loaded]);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(KEYS.requirements, JSON.stringify(requirements)).catch(e => console.log(e));
  }, [requirements, loaded]);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(KEYS.nonNegs, JSON.stringify(nonNegs)).catch(e => console.log(e));
  }, [nonNegs, loaded]);

  const setGender = (g: "girl" | "guy") => {
    setGenderState(g);
    AsyncStorage.setItem(KEYS.gender, g).catch(e => console.log(e));
  };

  const setLang = (l: "en" | "es") => {
    setLangState(l);
    AsyncStorage.setItem(KEYS.lang, l).catch(e => console.log(e));
  };

  const setRequirements = (r: Requirement[]) => setRequirementsState(r);
  const setNonNegs = (n: NonNeg[]) => setNonNegsState(n);

  const addCandidate = (c: Candidate) => setCandidates(p => [...p, c]);
  const updateCandidate = (c: Candidate) => setCandidates(p => p.map(x => x.id === c.id ? c : x));
  const deleteCandidate = (id: string) => setCandidates(p => p.filter(c => c.id !== id));

  const resetAll = async () => {
    setCandidates([]);
    const defaultReqs = gender === "girl" ? DEFAULT_REQUIREMENTS_GIRL : DEFAULT_REQUIREMENTS_GUY;
    setRequirementsState(defaultReqs);
    setNonNegsState(DEFAULT_NON_NEGS);
    await Promise.all([
      AsyncStorage.removeItem(KEYS.candidates),
      AsyncStorage.removeItem(KEYS.requirements),
      AsyncStorage.removeItem(KEYS.nonNegs),
    ]).catch(e => console.log(e));
  };

  const logout = async () => {
    await signOut(auth);
  };

  const deleteAccount = async () => {
    if (!auth.currentUser) return;
    await deleteUser(auth.currentUser);
    await Promise.all([
      AsyncStorage.removeItem(KEYS.candidates),
      AsyncStorage.removeItem(KEYS.requirements),
      AsyncStorage.removeItem(KEYS.nonNegs),
      AsyncStorage.removeItem(KEYS.gender),
      AsyncStorage.removeItem(KEYS.lang),
    ]);
  };

  return (
    <AppContext.Provider value={{
      gender, setGender, lang, setLang,
      candidates, addCandidate, updateCandidate, deleteCandidate,
      requirements, setRequirements, nonNegs, setNonNegs,
      resetAll, user, logout, deleteAccount,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
