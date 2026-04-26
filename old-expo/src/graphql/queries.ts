/**
 * GraphQL Query Definitions
 * All GraphQL queries for the Unraid API
 */

import { gql } from '@apollo/client';

/**
 * Query system information including OS, CPU, and Memory
 */
export const GET_SYSTEM_INFO = gql`
  query GetSystemInfo {
    info {
      os {
        platform
        distro
        release
        uptime
      }
      cpu {
        manufacturer
        brand
        cores
        threads
        flags
      }
    }
    metrics {
      cpu {
        percentTotal
        cpus {
          percentTotal
          percentUser
          percentSystem
        }
      }
      memory {
        total
        used
        free
        available
      }
    }
  }
`;

/**
 * Query virtual machines
 */
export const GET_VMS = gql`
  query GetVMs {
    vms {
      domain {
        id
        name
        state
      }
    }
  }
`;

/**
 * Query notifications overview and list
 */
export const GET_NOTIFICATIONS = gql`
  query GetNotifications($filter: NotificationFilter!) {
    notifications {
      overview {
        unread {
          info
          warning
          alert
          total
        }
        archive {
          info
          warning
          alert
          total
        }
      }
      list(filter: $filter) {
        id
        title
        subject
        description
        importance
        type
        link
        timestamp
        formattedTimestamp
      }
    }
  }
`;

/**
 * Query array/storage status
 */
export const GET_ARRAY_STATUS = gql`
  query GetArrayStatus {
    array {
      state
      capacity {
        kilobytes {
          total
          used
          free
        }
        disks {
          total
          used
          free
        }
      }
      disks {
        name
        size
        status
        temp
        device
        fsType
      }
    }
  }
`;

/**
 * Query Docker containers
 */
export const GET_DOCKER_CONTAINERS = gql`
  query GetDockerContainers {
    docker {
      containers(skipCache: false) {
        id
        names
        image
        state
        status
        autoStart
        ports {
          privatePort
          publicPort
          type
        }
        created
      }
    }
  }
`;

/**
 * Array control mutations
 */
export const START_ARRAY = gql`
  mutation StartArray {
    array {
      setState(input: { desiredState: START }) {
        state
      }
    }
  }
`;

export const STOP_ARRAY = gql`
  mutation StopArray {
    array {
      setState(input: { desiredState: STOP }) {
        state
      }
    }
  }
`;

/**
 * Docker control mutations
 */
export const START_CONTAINER = gql`
  mutation StartContainer($id: PrefixedID!) {
    docker {
      start(id: $id) {
        id
        state
        status
      }
    }
  }
`;

export const STOP_CONTAINER = gql`
  mutation StopContainer($id: PrefixedID!) {
    docker {
      stop(id: $id) {
        id
        state
        status
      }
    }
  }
`;

/**
 * VM control mutations
 */
export const START_VM = gql`
  mutation StartVM($id: PrefixedID!) {
    vm {
      start(id: $id)
    }
  }
`;

export const STOP_VM = gql`
  mutation StopVM($id: PrefixedID!) {
    vm {
      stop(id: $id)
    }
  }
`;

/**
 * Combined dashboard query for efficiency
 */
export const GET_DASHBOARD_DATA = gql`
  query GetDashboardData {
    info {
      time
      os {
        platform
        distro
        release
        uptime
        hostname
        kernel
      }
      cpu {
        manufacturer
        brand
        cores
        threads
        speed
        flags
      }
      baseboard {
        manufacturer
        model
        version
        memMax
        memSlots
      }
      devices {
        network {
          iface
          model
          vendor
          mac
          virtual
          speed
          dhcp
        }
      }
      versions {
        core {
          unraid
          api
          kernel
        }
      }
    }
    metrics {
      cpu {
        percentTotal
        cpus {
          percentTotal
          percentUser
          percentSystem
          percentIdle
        }
      }
      memory {
        total
        used
        free
        available
        percentTotal
      }
    }
    array {
      state
      capacity {
        kilobytes {
          total
          used
          free
        }
        disks {
          total
          used
          free
        }
      }
      disks {
        name
        size
        status
        temp
        device
        fsType
        type
      }
      caches {
        name
        size
        status
        temp
        device
        fsType
        type
      }
      boot {
        name
        device
        size
        fsSize
        fsFree
        fsUsed
        fsType
      }
    }
    shares {
      name
      size
      used
      free
      comment
    }
    vars {
      name
      version
    }
    registration {
      type
      state
    }
  }
`;

/**
 * Lightweight health check query
 */
export const HEALTH_CHECK = gql`
  query HealthCheck {
    info {
      os {
        platform
      }
    }
  }
`;

