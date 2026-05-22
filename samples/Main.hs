{-# LANGUAGE DeriveGeneric #-}
{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE RecordWildCards #-}

-- Advanced Haskell: ADTs, typeclasses, do-notation, pattern guards.

module Main where

import Data.Aeson (FromJSON, ToJSON, decodeStrict)
import Data.Text (Text)
import GHC.Generics (Generic)

data Status = Pending | Paid | Shipped | Cancelled
  deriving (Show, Eq, Generic, FromJSON, ToJSON)

data Order = Order
  { orderId :: Text
  , customer :: Text
  , total :: Double
  , status :: Status
  }
  deriving (Show, Eq, Generic, FromJSON, ToJSON)

describe :: Order -> String
describe Order {orderId, status = Paid, total}
  | total > 100 = "large paid order " ++ show orderId
describe Order {orderId, status} = "order " ++ show orderId ++ " (" ++ show status ++ ")"

validate :: Order -> Either String Order
validate o@Order {total}
  | total <= 0 = Left "total must be positive"
  | otherwise = Right o

paidTotal :: [Order] -> Double
paidTotal = sum . map total . filter ((== Paid) . status)

main :: IO ()
main = do
  let sample = Order "o-1" "Acme" 249.5 Paid
  putStrLn (describe sample)
  putStrLn ("paidTotal=" ++ show (paidTotal [sample]))
