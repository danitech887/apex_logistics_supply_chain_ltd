import { useState, useMemo } from 'react';

export const useGeneralLedger = (initialAccounts = [], initialJournals = []) => {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [journals, setJournals] = useState(initialJournals);

  const trialBalance = useMemo(() => {
    let totalDebit = 0;
    let totalCredit = 0;

    const list = accounts.map((acc) => {
      // Sum all debits and credits for this account across journals
      let accDebit = 0;
      let accCredit = 0;

      journals.forEach((j) => {
        j.lines.forEach((l) => {
          if (l.accountCode === acc.code) {
            accDebit += Number(l.debit || 0);
            accCredit += Number(l.credit || 0);
          }
        });
      });

      totalDebit += accDebit;
      totalCredit += accCredit;

      return {
        ...acc,
        debit: accDebit,
        credit: accCredit,
      };
    });

    return {
      accounts: list,
      totalDebit,
      totalCredit,
      isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
    };
  }, [accounts, journals]);

  const postJournal = (newEntry) => {
    setJournals((prev) => [newEntry, ...prev]);
  };

  return {
    accounts,
    journals,
    trialBalance,
    postJournal,
  };
};
