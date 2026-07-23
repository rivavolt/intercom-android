// Custom entry: the widget task handler must be registered from the app entry point so
// the headless JS task that renders/updates home-screen widgets finds it even when no
// Activity is running. Everything else defers to expo-router's standard entry.
import { registerWidgetTaskHandler } from 'react-native-android-widget';

import { widgetTaskHandler } from '@/widget/task-handler';

registerWidgetTaskHandler(widgetTaskHandler);

import 'expo-router/entry';
