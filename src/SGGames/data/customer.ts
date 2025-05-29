// File: customer.ts

export interface Customer {
  accountNumber: string;
  memberName: string;
  dob: string; // format: YYYY-MM-DD
  email: string;
  phone: string;
  maidenName?: string; // security_1
  favTeam?: string;    // security_2
}

export const customers: Customer[] = [
  {
    accountNumber: "ACC-001",
    memberName: "John Smith",
    dob: "1990-12-12",
    email: "johnsmith@gmail.com",
    phone: "2233866622",
    maidenName: "Williams",
    favTeam: "Red",
  },
  {
    accountNumber: "ACC-002",
    memberName: "Kim Lee",
    dob: "1987-05-08",
    email: "kim.lee@mail.com",
    phone: "9876543210",
    maidenName: "Park",
    favTeam: "Yellow",
  },
  {
    accountNumber: "ACC-003",
    memberName: "Tim Roy",
    dob: "1995-09-15",
    email: "tim.roy@outlook.com",
    phone: "8765432109",
    maidenName: "Ray",
    favTeam: "Green",
  },
  {
    accountNumber: "ACC-004",
    memberName: "Amy Lin",
    dob: "1989-03-22",
    email: "amy.lin@example.com",
    phone: "7654321098",
    maidenName: "Kim",
    favTeam: "Pink",
  },
  {
    accountNumber: "ACC-005",
    memberName: "Tom Max",
    dob: "1993-07-30",
    email: "tom.max@gmail.com",
    phone: "6543210987",
    maidenName: "Lee",
    favTeam: "Red",
  },
  {
    accountNumber: "ACC-006",
    memberName: "Lily Dan",
    dob: "1991-11-11",
    email: "lily.dan@mail.com",
    phone: "5432109876",
    maidenName: "Ran",
    favTeam: "Blue",
  }
];

