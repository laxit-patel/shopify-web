/** UI preview data — not from production APIs until wired up. */

export type MockCallRow = {
  orderId: string;
  orderName: string;
  status: string;
  outcome?: string;
  duration?: string;
  phone?: string;
  updatedAt: string;
};

export type MockEscalation = {
  orderName: string;
  orderId: string;
  reason: string;
  when: string;
  assignee?: string;
  status: "open" | "resolved";
};

export type MockTeamMember = {
  name: string;
  email: string;
  role: string;
  alerts: string;
};

export const MOCK_CALLS: MockCallRow[] = [
  {
    orderId: "7459256434797",
    orderName: "#1042",
    status: "completed",
    outcome: "Address confirmed",
    duration: "2:18",
    phone: "+91 98765 43210",
    updatedAt: "Today, 10:42",
  },
  {
    orderId: "7459256434808",
    orderName: "#1043",
    status: "in_call",
    phone: "+91 99999 11111",
    updatedAt: "Today, 11:05",
  },
  {
    orderId: "7459256434819",
    orderName: "#1039",
    status: "completed",
    outcome: "Reschedule requested",
    duration: "3:02",
    phone: "+91 90000 22222",
    updatedAt: "Yesterday",
  },
  {
    orderId: "7459256434820",
    orderName: "#1037",
    status: "cancelled",
    outcome: "No phone on order",
    updatedAt: "Yesterday",
  },
];

export const MOCK_ESCALATIONS: MockEscalation[] = [
  {
    orderName: "#1040",
    orderId: "7459256434821",
    reason: "Customer asked to speak with a manager",
    when: "2 hours ago",
    status: "open",
  },
  {
    orderName: "#1035",
    orderId: "7459256434815",
    reason: "Language not supported for region",
    when: "Yesterday",
    assignee: "Priya",
    status: "resolved",
  },
];

export const MOCK_TEAM: MockTeamMember[] = [
  {
    name: "You (owner)",
    email: "admin@vedanova.com",
    role: "Owner",
    alerts: "All recovery & escalations",
  },
  {
    name: "Ops lead",
    email: "ops@store.com",
    role: "Member",
    alerts: "Escalations only",
  },
];
