/**
 * Type definitions for Unraid API
 * These types represent the data structures returned by the Unraid GraphQL API
 */

export interface UnraidCredentials {
  serverIP: string;
  apiKey: string;
}

// System Information Types
export interface OSInfo {
  platform: string;
  distro?: string;
  release?: string;
  uptime: number | string; // Can be seconds (number) or ISO date string
  hostname?: string;
  kernel?: string;
}

export interface CPUUsage {
  currentLoad: number;
  currentLoadUser: number;
  currentLoadSystem?: number;
}

export interface CPUInfo {
  manufacturer: string;
  brand: string;
  cores: number;
  threads?: number;
  speed?: number;
  flags?: string;
  currentLoad?: number;
  currentLoadUser?: number;
  currentLoadSystem?: number;
  usage?: CPUUsage; // Keep for backward compatibility
}

export interface MemoryInfo {
  total: number | string;
  used: number | string;
  free: number | string;
  available?: number | string;
  percentTotal?: number;
}

export interface Baseboard {
  manufacturer?: string;
  model?: string;
  version?: string;
  memMax?: number;
  memSlots?: number;
}

export interface NetworkInterface {
  iface: string;
  model?: string;
  vendor?: string;
  mac?: string;
  virtual?: boolean;
  speed?: string;
  dhcp?: boolean;
}

export interface Versions {
  core: {
    unraid?: string;
    api?: string;
    kernel?: string;
  };
}

export interface SystemInfo {
  time?: string;
  os: OSInfo;
  cpu: CPUInfo;
  baseboard?: Baseboard;
  devices?: {
    network?: NetworkInterface[];
  };
  versions?: Versions;
  mem?: MemoryInfo; // Keep for backward compatibility
  memory?: MemoryInfo; // New field name from API
}

// Array/Storage Types
export interface DiskCapacity {
  total: number;
  used: number;
  free: number;
}

export interface Disk {
  name: string;
  size: number;
  status: string;
  temp?: number;
  device?: string;
  fsType?: string;
  mount?: string;
  type?: string;
  fsSize?: number;
  fsFree?: number;
  fsUsed?: number;
}

export interface ArrayCapacity {
  disks: DiskCapacity;
}

export interface ArrayInfo {
  state: string;
  capacity: ArrayCapacity;
  disks?: Disk[];
  caches?: Disk[];
  boot?: Disk;
}

// Docker Container Types
export interface DockerContainer {
  id: string;
  names: string[];
  image?: string;
  state: string;
  status: string;
  autoStart?: boolean;
  ports?: string[];
  created?: number;
}

// Combined Query Response Types
export interface SystemInfoResponse {
  info: SystemInfo;
}

export interface ArrayStatusResponse {
  array: ArrayInfo;
}

export interface DockerContainersResponse {
  dockerContainers: DockerContainer[];
}

export interface CPUCore {
  percentTotal: number;
  percentUser: number;
  percentSystem: number;
  percentIdle: number;
}

export interface Metrics {
  cpu?: {
    percentTotal: number;
    cpus?: CPUCore[];
  };
  memory?: {
    total: string | number;
    used: string | number;
    free: string | number;
    available?: string | number;
    percentTotal?: number;
  };
}

export interface Share {
  name: string;
  size?: number;
  used?: number;
  free?: number;
  comment?: string;
}

export interface Vars {
  name?: string;
  version?: string;
}

export interface Registration {
  type?: string;
  state?: string;
}

export interface DashboardData {
  info?: SystemInfo;
  metrics?: Metrics;
  array?: ArrayInfo;
  docker?: {
    containers?: DockerContainer[];
  };
  dockerContainers?: DockerContainer[]; // Keep for backward compatibility
  shares?: Share[];
  vars?: Vars;
  registration?: Registration;
}

// Error Types
export interface UnraidAPIError {
  message: string;
  code?: string;
  statusCode?: number;
}

