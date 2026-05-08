/**
 * Dusk Office — C++17 syntax preview (English comments).
 * Templates, RAII, constexpr, structured bindings, lambdas.
 */

#include <algorithm>
#include <cstdint>
#include <memory>
#include <optional>
#include <string>
#include <string_view>
#include <utility>
#include <vector>

namespace dusk::demo {

constexpr std::uint32_t kApiVersion = 1;

template <typename T>
struct Box {
    explicit Box(T v) : value_(std::move(v)) {}
    [[nodiscard]] const T &get() const noexcept { return value_; }
    void set(T v) { value_ = std::move(v); }

private:
    T value_;
};

enum class Status : std::int8_t { Ok = 0, IoError = -1, BadArg = -2 };

class Parser {
public:
    explicit Parser(std::string_view input) : input_(input) {}

    std::optional<std::uint32_t> nextUint() {
        skipSpaces();
        if (pos_ >= input_.size()) return std::nullopt;
        std::uint64_t acc = 0;
        auto i = pos_;
        while (i < input_.size() && input_[i] >= '0' && input_[i] <= '9') {
            acc = acc * 10u + static_cast<std::uint64_t>(input_[i] - '0');
            if (acc > UINT32_MAX) return std::nullopt;
            ++i;
        }
        if (i == pos_) return std::nullopt;
        pos_ = i;
        return static_cast<std::uint32_t>(acc);
    }

private:
    void skipSpaces() {
        while (pos_ < input_.size() && input_[pos_] == ' ') ++pos_;
    }

    std::string_view input_;
    std::size_t pos_{0};
};

inline std::string join(const std::vector<std::string> &parts, std::string_view sep) {
    if (parts.empty()) return {};
    std::string out = parts.front();
    for (std::size_t i = 1; i < parts.size(); ++i) {
        out.append(sep.data(), sep.size());
        out += parts[i];
    }
    return out;
}

} // namespace dusk::demo

int main(int argc, char **argv) {
    using dusk::demo::Box;
    using dusk::demo::join;
    using dusk::demo::kApiVersion;
    using dusk::demo::Parser;
    using dusk::demo::Status;

    if (argc < 2) {
        return static_cast<int>(Status::BadArg);
    }

    const Box<int> boxed(42);
    Parser p(argv[1]);
    const auto n = p.nextUint();

    std::vector<std::string> tags = {"cpp", "preview", "theme"};
    std::sort(tags.begin(), tags.end());

    if (n) {
        const auto [minTag, maxTag] = std::minmax(*tags.begin(), *tags.rbegin());
        (void)minTag;
        (void)maxTag;
    }

    const auto line = join(tags, " | ");
    const auto fn = [v = boxed.get()](int x) { return x * v + static_cast<int>(kApiVersion); };

    return n.has_value() ? fn(static_cast<int>(*n)) : static_cast<int>(Status::IoError);
}
