import { ReactNode } from "react";

export type Role = 'FARMER' | 'VENDOR' | 'COMMUNITY' | null;

export interface User {
  coords: any;
  _id: string;
  id: string;
  name: string;
  phone: string;
  password?: string;
  email?: string; 
  role: Role;
  location?: string;
  bankAccount?: string;
  ifsc?: string;
  verified?: boolean;
  verificationRequested?: boolean;
}

export interface Crop {
  
  id: string;
  farmerId: string;

  farmerName?: string;
  farmerLocation?: string;
  farmerPhone?: string;

  name: string;
  price: number;
  quantity: number;
  unit?: string;
  description: string;

  image?: string;
  portfolioUrl?: string;
  category: string;

  verified?: boolean;
  verificationRequested?: boolean;
  isSold?: boolean;
}


export interface CropGuidelines {
  durationDays: string;
  fertilizer: string;
  soil: string;
  temperature: string;
  stages: string[];
}

export interface FarmingTip {
  title: string;
  content: string;
  category: 'Soil' | 'Crops' | 'Weather' | 'Market' | 'Pests';
}

export interface VendorTip {
  title: string;
  content: string;
  category: 'Maintenance' | 'Selling' | 'Logistics' | 'Quality';
}

export interface CommunityTip {
  title: string;
  content: string;
  category: 'Support' | 'Growth' | 'Technology' | 'Logistics';
}

export interface Transaction {
  id: string;
  buyerId: string;
  sellerId: string;
  cropId: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'ESCROW_PAID' | 'IN_TRANSIT' | 'DELIVERED' | 'DISBURSED';
  deliveryMode: 'AGRICONNECT' | 'SELF_TRANSPORT';
  trackingInfo?: string;
  deliveryAddress?: string;
  estimatedArrival?: string;
  date: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'SUCCESS' | 'INFO' | 'ALERT';
}

export type Language = 'en' | 'hi' | 'te' | 'ta' | 'kn';

export interface TranslationSet {
  welcome: string;
  login: string;
  signup: string;
  logout: string;
  logoutConfirm: string;
  confirm: string;
  cancel: string;
  name: string;
  phone: string;
  password: string;
  confirmPassword: string;
  passwordMismatch: string;
  invalidPassword: string;
  location: string;
  alreadyAccount: string;
  noAccount: string;
  phoneExistsError: string;
  selectRole: string;
  chooseRoleDesc: string;
  farmer: string;
  farmerDesc: string;
  vendor: string;
  vendorDesc: string;
  community: string;
  communityDesc: string;
  completeProfile: string;
  profileGreeting: string;
  detailedLocation: string;
  payoutInfo: string;
  bankAccountNo: string;
  ifscCode: string;
  completeReg: string;
  dashboard: string;
  profile: string;
  crops: string;
  myCrops: string;
  sellNew: string;
  salesHistory: string;
  portfolio: string;
  updateProfile: string;
  cropName: string;
  pricePerKg: string;
  quantityAvail: string;
  cropImage: string;
  uploadImage: string;
  listCrop: string;
  stock: string;
  marketplace: string;
  searchCrops: string;
  searchLocation: string;
  buyNow: string;
  call: string;
  contactFarmer: string;
  summaryPayments: string;
  totalSpent: string;
  receiptTitle: string;
  amountPaid: string;
  orderId: string;
  delivery: string;
  done: string;
  dateLabel: string;
  communityHub: string;
  proxyReg: string;
  requests: string;
  verifyFarmer: string;
  inYourArea: string;
  outOfArea: string;
  areaMismatch: string;
  activeDirectory: string;
  rating: string;
  notifications: string;
  noNotifications: string;
  markAllRead: string;
  trustScore: string;
  paymentTitle: string;
  paySecurely: string;
  escrowNotice: string;
  processing: string;
  paymentSuccess: string;
  heldByPlatform: string;
  releaseToFarmer: string;
  paymentDisbursed: string;
  deliveryTracking: string;
  shipped: string;
  inTransit: string;
  delivered: string;
  markAsShipped: string;
  trackingId: string;
  viewTracking: string;
  cropGuide: string;
  growthDuration: string;
  fertilizerNeeds: string;
  soilRequirements: string;
  idealTemp: string;
  growthStages: string;
  fetchingGuide: string;
  farmingTips: string;
  expertAdvice: string;
  refreshTips: string;
  localizedFor: string;
  botGreeting: string;
  botInputPlaceholder: string;
  soldOut: string;
  vendorStrategy: string;
  deliveryByAgri: string;
  deliveryBySelf: string;
  maintenanceTips: string;
  sellingStrategy: string;
  communityStrategy: string;
  myFarmers: string;
  regionalVolume: string;
}