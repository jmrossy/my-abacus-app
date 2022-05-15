import path from 'path';
import '@nomiclabs/hardhat-waffle';
import { ethers } from 'hardhat';
import { utils } from '@abacus-network/deploy';

import { HelloWorldAddresses, HelloWorldApp } from '../src';
import { HelloWorldChecker, HelloWorldDeployer } from '../src/deploy';
import { configs } from '../src/deploy/networks';
import { AbacusCore } from '@abacus-network/sdk';

describe('deploy', async () => {
  type TestNetworks = 'test1' | 'test2' | 'test3';
  let deployer: HelloWorldDeployer<TestNetworks>;
  let addresses: Record<TestNetworks, HelloWorldAddresses>;
  let core: AbacusCore<TestNetworks>;

  before(async () => {
    const transactionConfigs = {
      test1: configs.test1,
      test2: configs.test2,
      test3: configs.test3,
    };
    const [signer] = await ethers.getSigners();
    const multiProvider = utils.getMultiProviderFromConfigAndSigner(
      transactionConfigs,
      signer,
    );
    core = AbacusCore.fromEnvironment('test', multiProvider);
    deployer = new HelloWorldDeployer(
      multiProvider,
      { owner: signer.address },
      core,
    );
  });

  it('deploys', async () => {
    addresses = await deployer.deploy();
  });

  it('writes', async () => {
    const base = './test/outputs/yo';
    deployer.writeVerification(path.join(base, 'verification'));
    deployer.writeContracts(addresses, path.join(base, 'contracts.ts'));
  });

  it('checks', async () => {
    const transactionConfigs = {
      test1: configs.test1,
      test2: configs.test2,
      test3: configs.test3,
    };
    const [signer] = await ethers.getSigners();
    const multiProvider = utils.getMultiProviderFromConfigAndSigner(
      transactionConfigs,
      signer,
    );
    const app = HelloWorldApp.fromNetworkAddresses<TestNetworks>(
      addresses,
      multiProvider,
      core,
    );
    const checker = new HelloWorldChecker(multiProvider, app, {
      test1: { owner: signer.address },
      test2: { owner: signer.address },
      test3: { owner: signer.address },
    });
    await checker.check();
    checker.expectEmpty();
  });
});
