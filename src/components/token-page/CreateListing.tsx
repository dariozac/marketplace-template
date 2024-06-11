import { NATIVE_TOKEN_ICON_MAP, Token } from "@/consts/supported_tokens";
import { useMarketplaceContext } from "@/hooks/useMarketplaceContext";
import { CheckIcon, ChevronDownIcon } from "@chakra-ui/icons";
import {
  Button,
  Flex,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  Image,
  useToast,
} from "@chakra-ui/react";
import { useRef, useState } from "react";
import { NATIVE_TOKEN_ADDRESS, sendAndConfirmTransaction } from "thirdweb";
import { createListing } from "thirdweb/extensions/marketplace";
import {
  useActiveWalletChain,
  useSwitchActiveWalletChain,
} from "thirdweb/react";
import type { Account } from "thirdweb/wallets";

type Props = {
  tokenId: bigint;
  account: Account;
};

export function CreateListing(props: Props) {
  const priceRef = useRef<HTMLInputElement>(null);
  const { tokenId, account } = props;
  const switchChain = useSwitchActiveWalletChain();
  const activeChain = useActiveWalletChain();
  const [currency, setCurrency] = useState<Token>();
  const toast = useToast();

  const {
    nftContract,
    marketplaceContract,
    refetchAllListings,
    type,
    supportedTokens,
  } = useMarketplaceContext();
  const chain = marketplaceContract.chain;

  const nativeToken: Token = {
    tokenAddress: NATIVE_TOKEN_ADDRESS,
    symbol: chain.nativeCurrency?.symbol || "NATIVE TOKEN",
    icon: NATIVE_TOKEN_ICON_MAP[chain.id] || "",
  };

  const options: Token[] = [nativeToken].concat(supportedTokens);

  return (
    <>
      <br />
      <Flex direction="column" w={{ base: "90vw", lg: "400px" }} gap="10px">
        <Text>Price</Text>
        <Input type="number" ref={priceRef} />
        <Menu>
          <MenuButton minH="48px" as={Button} rightIcon={<ChevronDownIcon />}>
            {currency ? (
              <Flex direction="row">
                <Image
                  boxSize="2rem"
                  borderRadius="full"
                  src={currency.icon}
                  mr="12px"
                />
                <Text my="auto">{currency.symbol}</Text>
              </Flex>
            ) : (
              "Select currency"
            )}
          </MenuButton>
          <MenuList>
            {options.map((token) => (
              <MenuItem
                minH="48px"
                key={token.tokenAddress}
                onClick={() => setCurrency(token)}
                display={"flex"}
                flexDir={"row"}
              >
                <Image
                  boxSize="2rem"
                  borderRadius="full"
                  src={token.icon}
                  ml="2px"
                  mr="14px"
                />
                <Text my="auto">{token.symbol}</Text>
                {token.tokenAddress.toLowerCase() ===
                  currency?.tokenAddress.toLowerCase() && <CheckIcon ml="auto" />}
              </MenuItem>
            ))}
          </MenuList>
        </Menu>
        <Button
          disabled={!currency}
          onClick={async () => {
            const value = priceRef.current?.value;
            if (!value) {
              return toast({
                title: "Please enter a price for this listing",
                status: "error",
                isClosable: true,
                duration: 5000,
              });
            }
            if (!currency) {
              return toast({
                title: `Please select a currency for the listing`,
                status: "error",
                isClosable: true,
                duration: 5000,
              });
            }
            if (activeChain?.id !== nftContract.chain.id) {
              await switchChain(nftContract.chain);
            }
            const transaction = createListing({
              contract: marketplaceContract,
              assetContractAddress: nftContract.address,
              tokenId,
              quantity: type === "ERC721" ? 1n : 1n,
              currencyContractAddress: currency?.tokenAddress,
              pricePerToken: value,
            });

            await sendAndConfirmTransaction({
              transaction,
              account,
            });
            refetchAllListings();
          }}
        >
          List
        </Button>
      </Flex>
    </>
  );
}
