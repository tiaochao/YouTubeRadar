module.exports = {
  packagerConfig: {
    name: 'YouTube Analytics Dashboard',
    executableName: 'youtube-analytics-dashboard',
    icon: './build/icon',
    appBundleId: 'com.yourcompany.youtube-analytics-dashboard',
    appCategoryType: 'public.app-category.productivity',
    asar: true,
    darwinDarkModeSupport: 'true',
    ignore: [
      /^\/src/,
      /^\/\.(.*)/,
      /^\/node_modules\/\.cache/,
      /^\/out/,
      /^\/dist/,
      /.git/,
      /.next\/cache/,
      /\.map$/,
      /\.md$/,
    ]
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'youtube_analytics_dashboard',
        setupIcon: './build/icon.ico'
      }
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin']
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          icon: './build/icon.png',
          maintainer: 'Your Name',
          homepage: 'https://your-website.com'
        }
      }
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {
        options: {
          icon: './build/icon.png',
          homepage: 'https://your-website.com'
        }
      }
    },
    {
      name: '@electron-forge/maker-dmg',
      config: {
        icon: './build/icon.icns',
        format: 'ULFO'
      }
    }
  ]
}