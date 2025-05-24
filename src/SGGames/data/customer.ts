// File: Customer.ts

export interface Customer {
    accountNumber: string;
    memberName: string;
    dob: string; // format: YYYY-MM-DD
    email: string;
    phone: string;
    maidenName?: string;
    favTeam?: string;
  }
  
  export const customers: Customer[] = [
    {
      accountNumber: "99 BE-99-9E09",
      memberName: "John Smith",
      dob: "1990-12-12",
      email: "johnsmith@gmail.com",
      phone: "2233866622",
      maidenName: "Williams",         // Optional (not currently shown)
      favTeam: "Lakers",              // Optional (not currently shown)
    },
    // You can add more customer objects here as needed
  ];
  