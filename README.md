# Boilerplate generation Schematics for Vault12 Guard

to use source version hosted on github

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
./node_modules/.bin/ng g @vault12/guard-schematics:ngxs-migration --migration-name=this-is-awesome

```

to use from npm:

``` bash
# make sure u have access to @vault12/* packages on npm
npm install @vault12/guard-schematics
ng g @vault12/guard-schematics:ngxs-migration

```
