# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Local Dev Proxy for The New Yorker (Web)

Use this only for local web development (`web + __DEV__`) to avoid CORS when importing from The New Yorker.

```bash
# terminal 1
npm run proxy:tny

# optional, if not using localhost:8787
EXPO_PUBLIC_TNY_PROXY_URL=http://localhost:8787
# terminal 2
npm run web
```

Then open Import and toggle **The New Yorker**.
Production builds do not use this local proxy.
