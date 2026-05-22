# AI Agent Guidance for kaifmarket2

## Project type
- React Native app using TypeScript
- Root entry: `App.tsx`
- Main navigation and screen wiring in `src/navigation/AppNavigator.tsx`
- Shared state via React context providers in `src/context/index.tsx`
- UI screens under `src/screens/`
- Reusable UI components under `src/components/`

## Key conventions
- Use the existing `RootStackParamList` and `TabParamList` types in `src/navigation/AppNavigator.tsx` for navigation params.
- App context is layered in `App.tsx` as `AuthProvider`, `NotifProvider`, `FavProvider`, `CartProvider`.
- The bottom tab bar is custom-rendered in `AppNavigator.tsx` and includes badge counts for notifications, cart items, and favorites.
- UI text and labels are in Spanish in several navigation tabs and screens.
- Avoid introducing new global state unless the feature clearly belongs in context.

## Common tasks
- Run `npm start` to start Metro
- Run `npm run android` to build/run Android
- Run `npm run ios` to build/run iOS (native pods required)
- Run `npm test` to execute Jest tests
- Run `npm run lint` to check ESLint

## Important files
- `App.tsx` — root providers and `AppNavigator`
- `src/navigation/AppNavigator.tsx` — bottom tabs and stack structure
- `src/context/index.tsx` — cart, auth, favorites, notifications contexts
- `src/screens/` — app screens and screen-specific behavior
- `src/components/` — presentational reusable UI pieces
- `README.md` — environment setup and React Native quick start guidance

## Notes for AI agents
- Do not assume this is a web React project; it is React Native.
- Keep behavior consistent with the existing mobile shopping marketplace UI.
- Prefer changes in `src/screens/*` and `src/components/*` for feature work.
- Use the existing patterns for state updates in context providers rather than adding ad hoc hooks.
- For iOS native work, respect the `ios/` folder and CocoaPods integration described in `README.md`.
