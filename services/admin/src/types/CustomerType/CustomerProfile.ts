
export interface CustomerProfile {
  accountId: string
  accountType: string
  username: string
  email: string
  phoneNumber: string
  firstName: string
  lastName: string
  address: string
  gender: "MALE" | "FEMALE" | "OTHER"
  dob: string
  customerId: string
  loyaltyPoints?: number
  noPassword?: boolean
}
