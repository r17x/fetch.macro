{
  inputs = {
    nixpkgs.follows = "cargo2nix/nixpkgs";
    flake-utils.url = "github:numtide/flake-utils";
    cargo2nix.url = "github:cargo2nix/cargo2nix/release-0.11.0";
    # rust-overlay.url = "github:oxalica/rust-overlay";
    pre-commit-hooks.url = "github:cachix/pre-commit-hooks.nix";
  };

  outputs = inputs: with inputs;

    flake-utils.lib.eachDefaultSystem (system:
      let

        rustPackagesOverlays = [
          cargo2nix.overlays.default
          # rust-overlay.overlays.default
        ];

        nodePackagesOverlays = [
          (final: prev: {
            # make nodejs same version with all nodePackages.<PKGS_NAME>
            # (e.g: nodePackages.yarn)
            nodejs = final.nodejs-16_x;
            nodePackages = prev.nodePackages.override {
              nodejs = final.nodejs-16_x;
            };
          })
        ];

        pkgs = import nixpkgs {
          inherit system;
          overlays = rustPackagesOverlays ++ nodePackagesOverlays;
        };

        pkgs-wasm = import nixpkgs {
          inherit system;
          crossSystem = {
            config = "wasm32-wasi";
            # Nixpkgs currently only supports LLVM lld linker for wasm32-wasi.
            useLLVM = true;
          };
          overlays = rustPackagesOverlays ++ nodePackagesOverlays;
        };

        rustVersion = "1.61.0";

        # when u want to use rust-overlay
        # rustWithWasmTarget = pkgs.rust-bin.stable.${rustVersion}.minimal.override {
        #   targets = [
        #     "wasm32-wasi"
        #   ];
        # };

        rustPackageSets = {
          inherit rustVersion;
          rustChannel = "stable";
          rustProfile = "minimal";
          # extraRustComponents = [ "rust-std" ];
          workspaceSrc = ./swc;
          # the file Cargo.nix was provided by command cargo2nix in swc directory
          packageFun = import ./swc/Cargo.nix;
          # target = "wasm32-unknown-unknown";
          target = "wasm32-wasi";
        };

        rustPkgs = pkgs.rustBuilder.makePackageSet rustPackageSets;
        # TODO
        # cargo2nix targeted to wasm32-wasi
        # rustPkgs-wasm = pkgs-wasm.rustBuilder.makePackageSet rustPackageSets;
      in
      rec {
        # nix flake check
        checks = {
          pre-commit-check = pre-commit-hooks.lib.${system}.run {
            src = ./.;
            hooks = {
              eslint.enable = true;
              rustfmt.enable = true;
              prettier.enable = true;
              nixpkgs-fmt.enable = true;
            };
          };
        };

        # nix develop 
        #
        # OR with current shell
        #
        # nix develop -C $SHELL 
        devShells.default = (rustPkgs.workspaceShell { }).overrideAttrs (oldAttrs: {
          name = "fetch_macro-devShell";

          shellHook = ''
            echo "Welcome to fetch.macro devShell 🛠️"
            echo ""
            echo "Commands -------------------------"
            echo "  yarn build - to build swc_plugin_fetch_macro."
            echo "  yarn test  - to run test for fetch.macro in nodejs and rust."
            echo "----------------------------------"
            echo ""
            echo "pre-commit-hooks status:"
          '' + checks.pre-commit-check.shellHook;

          packages = with pkgs; [
            nodejs
            nodePackages.yarn
            cargo2nix
          ];
        });

        packages = {
          swc_plugin_fetch_macro = (rustPkgs.workspace.swc_plugin_fetch_macro { }).bin;
          default = packages.swc_plugin_fetch_macro;
        };
      }
    );
}
