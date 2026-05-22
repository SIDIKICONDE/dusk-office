defmodule DuskOffice.Samples do
  @moduledoc """
  Advanced Elixir: structs, pattern matching, with, streams, behaviours.
  """

  defmodule Order do
    @enforce_keys [:id, :customer, :total]
    defstruct [:id, :customer, :total, status: :pending]

    @type t :: %__MODULE__{
            id: String.t(),
            customer: String.t(),
            total: float(),
            status: :pending | :paid | :shipped | :cancelled
          }
  end

  @spec describe(term()) :: String.t()
  def describe(%Order{id: id, status: :paid, total: total}) when total > 100 do
    "large paid order #{id}"
  end

  def describe(%Order{id: id, status: status}) do
    "order #{id} (#{status})"
  end

  def describe(value) when is_binary(value), do: "[INFO] #{value}"
  def describe(nil), do: "empty"
  def describe(other), do: inspect(other)

  def validate(%Order{total: total}) when total <= 0, do: {:error, :invalid_total}
  def validate(order), do: {:ok, order}

  def paid_revenue(orders) do
    orders
    |> Stream.filter(&(&1.status == :paid))
    |> Stream.map(& &1.total)
    |> Enum.sum()
  end

  def run do
    orders = [
      %Order{id: "o-1", customer: "Acme", total: 249.5, status: :paid},
      %Order{id: "o-2", customer: "Beta", total: 19.0, status: :pending}
    ]

    with {:ok, _} <- validate(hd(orders)) do
      IO.puts(describe(hd(orders)))
      IO.puts("revenue=#{paid_revenue(orders)}")
    end
  end
end
