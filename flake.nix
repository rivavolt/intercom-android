{
  description = "intercom-android — Expo/React Native app; Nix devShell with the Android SDK + NDK + JDK 17 for gradle builds of the prebuild output";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
    }:
    # x86_64-linux only: the Android SDK's aapt2 is an x86_64 binary with no working
    # aarch64 build on Asahi (16KB pages), so volt is the build host — build there,
    # deploy the APK over the tailnet.
    flake-utils.lib.eachSystem [ "x86_64-linux" ] (
      system:
      let
        pkgs = import nixpkgs {
          inherit system;
          config = {
            allowUnfree = true;
            android_sdk.accept_license = true;
          };
        };

        # Match react-native/gradle/libs.versions.toml for this Expo SDK exactly: the RN
        # gradle plugin installs missing SDK components by version and would fail trying
        # to write into the read-only Nix store.
        buildToolsVersion = "36.0.0";
        ndkVersion = "27.1.12297006";

        androidComposition = pkgs.androidenv.composeAndroidPackages {
          platformVersions = [ "36" ];
          buildToolsVersions = [ buildToolsVersion ];
          includeNDK = true;
          inherit ndkVersion;
          cmakeVersions = [ "3.22.1" ];
          includeSystemImages = false;
          includeEmulator = false;
        };

        androidSdk = androidComposition.androidsdk;
        sdkRoot = "${androidSdk}/libexec/android-sdk";
        jdk = pkgs.jdk17_headless;
      in
      {
        devShells.default = pkgs.mkShell {
          packages = [
            androidSdk
            jdk
            pkgs.android-tools
            pkgs.nodejs_22
            pkgs.bun
          ];

          env = {
            JAVA_HOME = "${jdk}";
            ANDROID_HOME = sdkRoot;
            ANDROID_SDK_ROOT = sdkRoot;
            ANDROID_NDK_ROOT = "${sdkRoot}/ndk/${ndkVersion}";
            # Point AGP at the SDK's aapt2 instead of the x86 binary it unpacks from the
            # Gradle-cached Maven jar, so nothing tries to mutate the store.
            GRADLE_OPTS = "-Dorg.gradle.project.android.aapt2FromMavenOverride=${sdkRoot}/build-tools/${buildToolsVersion}/aapt2";
          };

          shellHook = ''
            export PATH="${sdkRoot}/platform-tools:$PATH"
            echo "intercom-android toolchain (nix): platform 36 / build-tools ${buildToolsVersion} / ndk ${ndkVersion}"
            echo "  bun install && npx expo prebuild --platform android && (cd android && ./gradlew assembleDebug)"
          '';
        };
      }
    );
}
