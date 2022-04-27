import { Address, BigInt } from '@graphprotocol/graph-ts';
import { PIXStaked, PIXUnstaked } from './entities/PIXStaking/PIXStaking';
import { PIXStaking } from './entities/schema';

export function handlePIXStaked(event: PIXStaked): void {
  let pixStaking = PIXStaking.load(
    getPIXStakingId(event.params.account, event.params.tokenId)
  );

  if (pixStaking == null) {
    let pixStaking = new PIXStaking(
      getPIXStakingId(event.params.account, event.params.tokenId)
    );
    pixStaking.pix = getPIXId(event.params.tokenId);
    pixStaking.account = event.params.account.toHexString();
  }

  pixStaking.staked = true;

  pixStaking.save();
}

export function handlePIXUnstaked(event: PIXUnstaked): void {
  let pixStaking = PIXStaking.load(
    getPIXStakingId(event.params.account, event.params.tokenId)
  );

  pixStaking.staked = false;

  pixStaking.save();
}

function getPIXStakingId(account: Address, tokenId: BigInt): string {
  return 'PIX Staking - ' + account.toHexString() + ' - ' + tokenId.toString();
}

function getPIXId(id: BigInt): string {
  return 'PIX - ' + id.toString();
}