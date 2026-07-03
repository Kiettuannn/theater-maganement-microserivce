
export interface StaffProfile {
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
  staffId: string
  cinemaId: string
  jobTitle: string
  avatarUrl: string | null
  roles: Array<{
    name: string
    description: string
    permissions: Array<{
      name: string
      description: string
    }>
  }>
}