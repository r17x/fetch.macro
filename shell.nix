# https://nixos.org/download.html
{ pkgs ? import <nixpkgs> {
    overlays = [
      (import (builtins.fetchTarball "https://github.com/oxalica/rust-overlay/archive/master.tar.gz"))
    ];
  }
}:

pkgs.mkShell {
  name = "fetch.macro";

  buildInputs = with pkgs; [
    python27
    pkgconfig
    openssl
    rust-bin.stable.latest.default
    rustup
    libgit2
  ];

  packages = with pkgs; [
    nodejs-16_x
    (yarn.overrideAttrs (oldAttrs: {
      buildInputs = [ nodejs-16_x ]; # sync nodejs version in yarn
    }))
  ];
}
