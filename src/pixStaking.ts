import { Address, BigInt } from '@graphprotocol/graph-ts';
import { PIXStaked, PIXUnstaked } from './entities/PIXStaking/PIXStaking';
import { PIXStaking, PIX } from './entities/schema';

export function handlePIXStaked(event: PIXStaked): void {
  let pixStaking = PIXStaking.load(
    getPIXStakingId(event.params.account, event.params.tokenId)
  );

  if (pixStaking == null) {
    pixStaking = new PIXStaking(
      getPIXStakingId(event.params.account, event.params.tokenId)
    );
    let pix = PIX.load(getPIXId(event.params.tokenId));
    pixStaking.pix = pix.id;
    pixStaking.pixId = pix.pixId;
    pixStaking.category = pix.category;
    pixStaking.size = pix.size;
    pixStaking.account = event.params.account.toHexString();
  }

  pixStaking.staked = true;
  pixStaking.stakedAt = event.block.timestamp;

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
