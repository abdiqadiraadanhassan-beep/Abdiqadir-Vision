
{
  "app": {
    "name": "Abdiqadir Vision",
    "slug": "abdiqadir-vision",
    "version": "1.0.0",
    "description": "Social Media App",
    "language": "Somali",
    "internetRequired": true
  },
  "features": {
    "authentication": true,
    "userProfiles": true,
    "uploadVideos": true,
    "uploadPhotos": true,
    "textPosts": true,
    "audioPosts": true,
    "voiceRecordings": true,
    "comments": true,
    "likes": true,
    "sharing": true,
    "following": true,
    "notifications": true
  },
  "admin": {
    "owner": "Abdiqadir",
    "dashboard": true,
    "fullControl": true,
    "manageUsers": true,
    "managePosts": true,
    "manageVideos": true,
    "managePhotos": true,
    "manageComments": true,
    "addAdmins": true,
    "assignPermissions": true
  },
  "security": {
    "privateAdminDashboard": true,
    "roleBasedAccess": true,
    "secureAuthentication": true,
    "databasePermissions": true
  },
  "backend": {
    "provider": "Supabase",
    "authentication": true,
    "database": true,
    "storage": true,
    "onlineSync": true
  },
  "platform": {
    "android": true,
    "ios": true,
    "responsive": true
  },
  "branding": {
    "appName": "Abdiqadir Vision",
    "logo": true,
    "theme": "Modern Social Media"
  },
  "build": {
    "android": {
      "buildType": "apk",
      "distribution": "internal"
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  },
  "submit": {
    "production": {}
  }
      }
