import { Address, BigInt } from '@graphprotocol/graph-ts';
import { PIXStaked, PIXUnstaked } from './entities/PIXStaking/PIXStaking';
import { PIXStaking, PIX, Global } from './entities/schema';

export function handlePIXStaked(event: PIXStaked): void {
  let pixStaking = PIXStaking.load(
    getPIXStakingId(event.params.account, event.params.tokenId)
  );
  let pix = PIX.load(getPIXId(event.params.tokenId));

  if (pixStaking == null) {
    pixStaking = new PIXStaking(
      getPIXStakingId(event.params.account, event.params.tokenId)
    );
    pixStaking.pix = pix.id;
    pixStaking.pixId = pix.pixId;
    pixStaking.category = pix.category;
    pixStaking.size = pix.size;
    pixStaking.account = event.params.account.toHexString();
  }

  pixStaking.staked = true;
  pixStaking.stakedAt = event.block.timestamp;

  pixStaking.save();

  let entity = Global.load(getPIXStakingCategoryId(pixStaking.category));
  if (entity == null) {
    entity = new Global(getPIXStakingCategoryId(pixStaking.category));
    entity.value = new BigInt(0);
  }
  entity.value = entity.value.plus(BigInt.fromI32(1));
  entity.save();

  let entityTVL = Global.load(getPIXStakingCategoryTVLId(pixStaking.category));
  if (entityTVL == null) {
    entityTVL = new Global(getPIXStakingCategoryTVLId(pixStaking.category));
    entityTVL.value = new BigInt(0);
  }
  entityTVL.value = entityTVL.value.plus(pix.tier);
  entityTVL.save();
}

export function handlePIXUnstaked(event: PIXUnstaked): void {
  let pixStaking = PIXStaking.load(
    getPIXStakingId(event.params.account, event.params.tokenId)
  );
  let pix = PIX.load(getPIXId(event.params.tokenId));

  pixStaking.staked = false;

  pixStaking.save();

  let entity = Global.load(getPIXStakingCategoryId(pixStaking.category));
  entity.value = entity.value.minus(BigInt.fromI32(1));
  entity.save();

  let entityTVL = Global.load(getPIXStakingCategoryTVLId(pixStaking.category));
  entityTVL.value = entityTVL.value.minus(pix.tier);
  entityTVL.save();
}

function getPIXStakingId(account: Address, tokenId: BigInt): string {
  return 'PIX Staking - ' + account.toHexString() + ' - ' + tokenId.toString();
}

function getPIXId(id: BigInt): string {
  return 'PIX - ' + id.toString();
}

function getPIXStakingCategoryId(category: BigInt): string {
  return 'pixStaking - Category - ' + category.toString();
}

function getPIXStakingCategoryTVLId(category: BigInt): string {
  return 'pixStaking - Category - TVL - ' + category.toString();
}
