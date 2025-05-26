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
    favTeam: "Lakers",
  },
  {
    accountNumber: "ACC-002",
    memberName: "Emily Davis",
    dob: "1987-05-08",
    email: "emily.davis@mail.com",
    phone: "9876543210",
    maidenName: "Johnson",
    favTeam: "Warriors",
  },
  {
    accountNumber: "ACC-003",
    memberName: "Carlos Martinez",
    dob: "1995-09-15",
    email: "carlosm95@outlook.com",
    phone: "8765432109",
    maidenName: "Ramos",
    favTeam: "Knicks",
  },
  {
    accountNumber: "ACC-004",
    memberName: "Sarah Lee",
    dob: "1989-03-22",
    email: "sarah.lee@example.com",
    phone: "7654321098",
    maidenName: "Kim",
    favTeam: "Celtics",
  },
  {
    accountNumber: "ACC-005",
    memberName: "James Anderson",
    dob: "1993-07-30",
    email: "james.a@gmail.com",
    phone: "6543210987",
    maidenName: "Morgan",
    favTeam: "Heat",
  },
  {
    accountNumber: "ACC-006",
    memberName: "Olivia Brown",
    dob: "1991-11-11",
    email: "olivia.b@mail.com",
    phone: "5432109876",
    maidenName: "Clark",
    favTeam: "Raptors",
  }
];
