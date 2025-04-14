# Boilerplate Schematics for Vault12 Guard

``` bash
# clone repo localy
git clone https://github.com/griga/vault12-guard-schematics

# as this are typescript sources u need to build them to use with angular schematics machinery
# u can use npm for install and build
cd vault12-guard-schematics
pnpm install
pnpm build

# next npm link it into main repo
cd ../vault12
npm link ../vault12-guard-schematics

# usage
./node_modules/.bin/ng g vault12-guard-schematics:ngxs-migration --migration-name=this-is-awesome

```
