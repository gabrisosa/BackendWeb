
export const Query = {
  test: (parent: any, args: { num: number }): number => {
    return 2 * args.num
  }
}