import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Field, Form, Formik} from "formik";
import {useRouter} from "next/router";
import {useWeb3Hook} from "./context/WalletProviderContext";

export default function Dashboard() {
  const router = useRouter();

  const {handleSubmit, connectWallet, connectWallettoMetamask} = useWeb3Hook();

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-10000 w-full">
      <div className="flex flex-col gap-3 mb-3 w-1/2">
        <Button
          variant={"outline"}
          className=""
          onClick={connectWallettoMetamask}
        >
          Connect to Neon EVM
        </Button>
        <Button variant={"outline"} className="" onClick={connectWallet}>
          Connect to Solana
        </Button>
      </div>
      <Formik
        initialValues={{
          from: "",
          to: "",
          tokenAmount: "",
        }}
        onSubmit={(values) => {
          handleSubmit;
        }}
      >
        <Form className="flex flex-col gap-3">
          <Button variant={"outline"}>Add wSOL to Metamask</Button>
          <Button variant={"outline"}>Add wSOL to Phantom</Button>
          <div className="flex gap-3">
            <div>
              <Field
                as={Input}
                name="from"
                type="number"
                placeholder="From NEON"
                className="w-full"
              />
            </div>
            <div>
              <Field
                as={Input}
                name="to"
                type="number"
                placeholder="To SOL"
                className="w-full"
              />
            </div>
          </div>
          <div>
            <Field
              as={Input}
              type="number"
              name="tokenAmount"
              placeholder="Token Amount"
              className="w-full"
            />
          </div>
          <Button type="submit">Submit</Button>
        </Form>
      </Formik>
    </div>
  );
}
