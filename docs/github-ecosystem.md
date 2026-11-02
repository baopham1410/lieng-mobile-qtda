# GitHub Ecosystem (QLDA)

## Da thiet lap

| Hang muc | Trang thai |
|----------|------------|
| Repo cong khai | https://github.com/baopham1410/lieng-mobile-qtda |
| Branch protection `main` | Bat buoc PR + 1 approve + CI 3 job |
| Conventional Commits | `feat:` `fix:` `docs:` `ci:` `chore:` `test:` |
| GitHub Actions CI | `.github/workflows/ci.yml` |
| Issue template + AC | `.github/ISSUE_TEMPLATE/user-story.md` |
| PR template | `.github/PULL_REQUEST_TEMPLATE.md` |
| CODEOWNERS | `.github/CODEOWNERS` |

## GitHub Projects (Kanban)

Tao board (1 lan), cot dung theo Charter:

1. Backlog
2. Ready
3. In Progress
4. In Review
5. Done

Gan Issue theo Sprint/Milestone. Vao **Insights** de xuat Burndown theo Sprint.

### CLI (sau khi `gh auth refresh -h github.com -s project,read:project`)

```bash
gh project create --owner baopham1410 --title "Lieng Mobile QLDA"
gh project link --owner baopham1410 <number> --repo baopham1410/lieng-mobile-qtda
```

## Peer review

- Bao khong tu approve PR cua Bao; Hong khong tu approve PR cua Hong.
- Moi PR request review it nhat 1 thanh vien con lai.
- Merge `main` chi khi CI xanh + co Approve.
