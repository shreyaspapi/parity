import Foundation

enum GraphQLOperations {
    static let healthCheck = """
    query HealthCheck {
      info {
        os {
          platform
        }
      }
    }
    """

    static let dashboard = """
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
    """

    static let dockerContainers = """
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
    """

    static let vms = """
    query GetVMs {
      vms {
        domain {
          id
          name
          state
        }
      }
    }
    """

    static let notifications = """
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
    """

    static let startArray = """
    mutation StartArray {
      array {
        setState(input: { desiredState: START }) {
          state
        }
      }
    }
    """

    static let stopArray = """
    mutation StopArray {
      array {
        setState(input: { desiredState: STOP }) {
          state
        }
      }
    }
    """

    static let startContainer = """
    mutation StartContainer($id: PrefixedID!) {
      docker {
        start(id: $id) {
          id
          state
          status
        }
      }
    }
    """

    static let stopContainer = """
    mutation StopContainer($id: PrefixedID!) {
      docker {
        stop(id: $id) {
          id
          state
          status
        }
      }
    }
    """

    static let startVM = """
    mutation StartVM($id: PrefixedID!) {
      vm {
        start(id: $id)
      }
    }
    """

    static let stopVM = """
    mutation StopVM($id: PrefixedID!) {
      vm {
        stop(id: $id)
      }
    }
    """
}
