import "./AddLiquidity.css";
import { Tabs, Form } from "radix-ui";
import type { ReactNode } from "react";

function AddLiquidity() {
  return (
    <>
      <div className="add-liquidity">
        <Form.Root className="FormRoot">
          <Form.Field className="FormField" name="email">
            <Form.Label className="FormLabel">
              Email
              <div>
                <Form.Label className="FormLabel">Email</Form.Label>
                <Form.Message className="FormMessage" match="valueMissing">
                  Please enter your email
                </Form.Message>
              </div>
            </Form.Label>
            <Form.Control asChild>
              <input className="Input" type="email" required />
            </Form.Control>
          </Form.Field>
        </Form.Root>
      </div>
    </>
  );
}

export default AddLiquidity;
