/**
 * Dusk Office — C syntax preview (English comments).
 * C11-ish: designated initializers, anonymous structs (where supported), stdint.
 */

#include <errno.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define API_VERSION 1u
#define MAX_NAME_LEN 64
#define clamp(x, lo, hi) ((x) < (lo) ? (lo) : (x) > (hi) ? (hi) : (x))

typedef enum {
    STATUS_OK = 0,
    STATUS_ERR_IO = -1,
    STATUS_ERR_ARG = -2,
} StatusCode;

typedef struct {
    char name[MAX_NAME_LEN];
    uint32_t id;
    double score;
} Record;

static int compare_record_id(const void *a, const void *b) {
    const Record *ra = (const Record *)a;
    const Record *rb = (const Record *)b;
    if (ra->id < rb->id) return -1;
    if (ra->id > rb->id) return 1;
    return 0;
}

/**
 * Parse unsigned from decimal ASCII; returns 0 on empty, sets *out_end to last consumed+1.
 */
static uint32_t parse_u32(const char *s, const char **out_end) {
    uint32_t v = 0;
    const char *p = s;
    while (*p >= '0' && *p <= '9') {
        v = v * 10u + (uint32_t)(*p - '0');
        ++p;
    }
    if (out_end) *out_end = p;
    return v;
}

int main(int argc, char **argv) {
    if (argc < 2) {
        fprintf(stderr, "usage: %s <id>\n", argv[0]);
        return STATUS_ERR_ARG;
    }

    const char *end = NULL;
    uint32_t id = parse_u32(argv[1], &end);
    if (end == argv[1] || *end != '\0') {
        fprintf(stderr, "invalid id: %s\n", argv[1]);
        return STATUS_ERR_ARG;
    }

    Record items[] = {
        {.name = "alpha", .id = 10u, .score = 0.25},
        {.name = "beta", .id = id, .score = 3.1415926535},
        {.name = "gamma", .id = 42u, .score = -0.0},
    };

    const size_t n = sizeof items / sizeof items[0];
    qsort(items, n, sizeof(Record), compare_record_id);

    printf("API v%u, records=%zu\n", API_VERSION, n);
    for (size_t i = 0; i < n; ++i) {
        const double s = clamp(items[i].score, 0.0, 10.0);
        printf("[%u] %-8s score=%.4f\n", items[i].id, items[i].name, s);
    }

    return STATUS_OK;
}
